import listen from '/static/stt.js'

// hash a question into a localStorage id
const hashCode = (s,lv) => `lv${lv}/` + s.split('').reduce((a, b) => (a = ((a << 5) - a) + b.charCodeAt(0), a & a), 0);
// add lazy attribut to img
function lazy_img(md) {
    var defaultImageRenderer = md.renderer.rules.image;
    md.renderer.rules.image = function (tokens, idx, options, env, self) {
      tokens[idx].attrSet('loading', 'lazy');
      return defaultImageRenderer(tokens, idx, options, env, self);
    };
};
// convert list + checkbox into interactiv exam
const listCheckboxRule = (validated,level) => function (state) {
    const all = state.tokens;
    for (let i = 0; i < all.length; i++) {
        // search for a paragraph-prefixed bullet list
        if (i < 1 || all[i].type !== "bullet_list_open" || all[i - 1].type !== "paragraph_close") continue;
        // extract it prefix text
        const name = hashCode(all[i - 2].content, level);
        for (let j = i; all[j].type !== "bullet_list_close" && j < all.length; j++) {
            if (all[j].type !== "inline" || all[j].children.length != 4 || all[j].children[1].type != 'checkbox_input') continue;
            const checkbox = all[j].children[1];
            checkbox.attrSet('name', name);
            // disable if already done, else hide result
            if (validated.includes(name)) {
                checkbox.attrSet('disabled', '');
                checkbox.attrs.find(([k, v]) => k == "checked") && checkbox.attrs.push(['data-checked','']);
            } else {
                checkbox.attrs = checkbox.attrs.map(([k, v]) => k == "checked" ? [`data-${k}`, v] : [k, v]);
            }
        }
    }
};
// convert 🎙️ value into HTML input
const inputRule = (validated, level) => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children.map(child => {
        const matches = [...child.content.matchAll(/^(🎙️)\s*(.*)$/g)];
        return matches.length ? matches.map(([_, content, value]) => [
            new state.Token("label_open", "label", 1),
            Object.assign(new state.Token("text_input", "input", 0), {
                attrs: [
                    [validated.includes(hashCode(value,level)) ? "disabled" : "readonly", ""],
                    ["class", "voice"],
                    ["data-value", value],
                    ["name", hashCode(value,level)]
                ].concat(validated.includes(hashCode(value,level)) ? [["value", value]] : [])
            }),
            new state.Token("label_close", "label", -1),
        ]).flat() : [child];
    }).flat());
};
// convert [ ] label into HTML checkbox
const checkboxRule = () => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children.map(child => {
        const matches = [...child.content.matchAll(/\[(x|X|\s|\*|\_|\-)\]\s([^\[]*)/g)];
        return matches.length ? matches.map(([_, value, content]) => [
            new state.Token("label_open", "label", 1),
            Object.assign(new state.Token("checkbox_input", "input", 0), { attrs: [["type", "checkbox"]].concat((value.toLowerCase() === "x") ? [["checked", ""]] : []) }),
            Object.assign(new state.Token("text", "", 0), { content }),
            new state.Token("label_close", "label", -1),
        ]).flat() : [child];
    }).flat());
};
// adapt ![alt](url) tag to it extension (mp3: <audio>, webm: <video> ...)
const mediaRule = (ext2tag = (ext, img) => ({
    mp3: { tag: 'audio', nesting: 1, attrs: [...img.attrs, ['controls', '']] },
    mp4: { tag: 'video', nesting: 1, attrs: [...img.attrs, ['controls', '']] },
    webm: { tag: 'video', nesting: 1, attrs: [...img.attrs, ['controls', '']] },
}[ext]), getext = (img) => img.attrs[img.attrIndex('src')][1].toLowerCase().match(/\w*$/)[0]) => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children
        .map(img => img.type == "image" ? Object.assign(img, ext2tag(getext(img), img)) : img)
        .map(img => img.type == "image" && img.nesting == 1 ? [img, new state.Token("image_close", img.tag, -1)] : [img]).flat());
};

const LessonShow = {
    props: ['id'],
    template: `
    <form v-if=isExam  id=lesson class=lesson @click=clicked @submit.prevent=validateForm v-html="markdownToHtml"></form>
    <form v-if=!isExam id=lesson class=lesson @click=clicked @input.prevent=validateInput v-html="markdownToHtml"></form>
    <button v-if=isExam form=lesson class="button primary is-full-width">Validate</button>
    <hr>
    <router-link :to=$router.options.history.state.back class="button outline">&lt;&lt; Back</router-link>`,
    data() { return { lesson: "", isExam: false, level:0} },
    computed: {
        markdownToHtml() {
            const progress = Object.keys(JSON.parse(localStorage.progress || '{}'));
            const mi = markdownit({ html: true });
            mi.use(lazy_img);
            mi.core.ruler.push("media", mediaRule());
            mi.core.ruler.push("checkbox", checkboxRule(this.level));
            mi.core.ruler.push("input", inputRule(progress, this.level));
            mi.core.ruler.push("exam", listCheckboxRule(progress, this.level));
            return this.lesson ? mi.render(this.lesson) : '...';
        }
    },
    methods: {
        async clicked({ target }) {
            if (!target.classList.contains("voice")) return;
            await listen(target, 5000);
            this.validateInput({ target });
        },
        validateForm({ target }) {
            const elems = Object.keys(target.elements).filter(e=>e.startsWith('lv')).map(n=>target.elements[n]);
            const radio = elems.filter(e => e.constructor == RadioNodeList);
            const texts = elems.filter(e => e.constructor == HTMLInputElement && e.type == 'text');
            const valid = [...texts.filter(input => input.dataset.value == input.value),
                           ...radio.filter(checks => [...checks].every(check => (check.dataset.checked==='') === check.checked))];
            console.log(elems, valid);
            const ratio = valid.length / (radio.length + texts.length);
            const bargain = .75;
            const info = `You have ${(100*ratio)|0}% accuracy`;
            if (ratio < bargain) {
                return alert(`${info}\nBut you need ${(100*bargain)|0}%`);
            }
            alert(`${info}\nCongratulation !`)
            Object.assign(new Audio('/static/quizz.ogg'), { volume: .1 }).play()
            const progress = JSON.parse(localStorage.progress || '{}');
            progress[decodeURIComponent(location.hash.replace(/^#/,''))] = 1;
            this.$root.progress = progress;
            localStorage.progress = JSON.stringify(progress);
            setTimeout(this.$router.back, 1000)
        },
        validateInput({ target }) {
            if(!target.name)return;
            const inputs = target.form[target.name];
            let correct = false;
            if (inputs.constructor == HTMLInputElement) {
                correct = inputs.dataset.value == inputs.value;
            }
            if (inputs.constructor == RadioNodeList) {
                // bad/incomplete try : shall we tell student ? it break the point of multiple responses...
                if (target.dataset.checked === undefined) {
                    console.log("wrong answer");
                    this.$root.$refs.bot.response(false);
                }
                correct = [...inputs].every(c => c.checked == (c.dataset.checked !== undefined));
            }
            if (!correct) return;
            const progress = JSON.parse(localStorage.progress || '{}');
            progress[target.name] = 1;
            (inputs.length ? inputs : [inputs]).forEach(c => c.disabled = true);
            const remain = target.form.querySelector('input:not([disabled])');
            if (!remain) {
                progress[decodeURIComponent(location.hash.replace(/^#/,''))] = 1;
                setTimeout(this.$router.back, 1000)
            }
            Object.assign(new Audio(remain ? '/static/question.ogg' : '/static/quizz.ogg'), { volume: .1 }).play()
            this.$root.progress = progress;
            this.$root.$refs.bot.response(true);
            localStorage.progress = JSON.stringify(progress);
        }
    },
    async mounted() {
        this.level = +(this.$props.id.match(/\[level:(\d+)\]/)||['','0'])[1];
        this.isExam = this.$props.id.includes('[mode:exam]');
        this.lesson = await (await fetch(`/media/md/${this.$props.id}`)).text();
    }
}
//URL.createObjectURL(new Blob(Uint8Array.from(s.content.slice(2).match(/../g),a=>parseInt(a,16)), { type: "image/jpeg" } ))
const LessonList = {
    __doc__: `List Lesson for a given .category and group them by they .group`,
    props: ['tag'],
    template: `
    <progress v-if="groups==null"/>
    <p v-else-if="groups.length===0">
        No group/lesson with tag {{$props.tag}}. You can Import them with
        <pre>make lesson_init</pre>
        then <a href=>refresh</a> this page.
    </p>
    <template v-for="group in groups">
        <div class="title text-capitalize">{{group.title.split(":")[0]}}</div>
        <div class="text-grey">{{group.title.split(":")[1]}}</div>
        <div class=grid>
            <router-link v-for="lesson in group.list" :to="'/lesson/'+lesson.name" :class="'ovh '+reachable(lesson)">
                <span style="text-align:center" :class="'tag is-small ' + ((reachable(lesson)=='forbidden')?'bg-error text-light':'text-success')">{{lesson.level}}</span>
                <img :src="'/media/icons/'+lesson.icon+'.svg'" style="padding: 15%;" width=500 height=500 alt="lesson" loading=lazy>
                <span class="text-capitalize is-center">{{lesson.title.replace(/^[^a-zA-Z]+/, '')}}</span>
            </router-link>
        </div>
    </template>
    `,
    methods: {
        reachable(lesson) {
            if (lesson.level > this.$root.myLv)
                return 'forbidden';
            if (JSON.parse(localStorage.progress||'[]')[`/lesson/${decodeURIComponent(lesson.name)}`] !== undefined)
                return 'done card';
            return 'card'
        }
    },
    computed: { 
        groups() {
            return this.$root.mds.filter(lesson => lesson.category==this.tag)
            .reduce(function (groups, lesson) {
                const existing = groups.find(group => group.path == lesson.group);
                existing ? existing.list.push(lesson) : groups.push({
                    title: (lesson.group||'').replace(/^[^a-zA-Z]+/, ''),
                    path: lesson.group,
                    list: [lesson]
                })
                return groups
            }, [])
            .sort((a, b) => a.path.localeCompare(b.path)) // sort groups by they numbered named
            .map(group => ({
                ...group, list: group.list // sort grouped lessons by they level + name
                    .sort((a, b) => a.title.localeCompare(b.title))
                    .sort((a, b) => a.level - b.level)
            }))
        }
    },
}

const CategoriesList = {
    __doc__: `List "category:" tags from all lessons`,
    template: `
    <progress v-if="categories===null"></progress>
    <p v-else-if="categories.length===0">No category found.</p>
    <div class=grid>
        <router-link v-for="category in categories" :to="'/category/'+category.path" class="card ovh">
            <img :src='"/media/icons/"+category.name+".svg"' style="padding: 15%;" width=500 height=500 alt="category" loading=lazy>
            <span class="is-center text-capitalize">{{category.name}}</span>
        </router-link >
    </div>
    `,
    computed: {
        categories() {
            return [...new Set(this.$root.mds.map(t=>t.category))].map(path => ({ path, name: path.replace(/^[^a-zA-Z]+/, '') }));
        },
    }
}

export { LessonList, LessonShow, CategoriesList }