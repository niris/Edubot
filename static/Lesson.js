// hash a question into a localStorage id
const hashCode = s => s.split('').reduce((a, b) => (a = ((a << 5) - a) + b.charCodeAt(0), a & a), 0);
// convert list + checkbox into interactiv exam
const listCheckboxRule = (validated) => function (state) {
    const all = state.tokens;
    for (let i = 0; i < all.length; i++) {
        // search for a paragraph-prefixed bullet list
        if (i < 1 || all[i].type !== "bullet_list_open" || all[i - 1].type !== "paragraph_close") continue;
        // extract it prefix text
        const name = 'h' + hashCode(all[i - 2].content);
        for (let j = i; all[j].type !== "bullet_list_close" && j < all.length; j++) {
            if (all[j].type !== "inline" || all[j].children.length != 4 || all[j].children[1].type != 'checkbox_input') continue;
            const checkbox = all[j].children[1];
            checkbox.attrSet('name', name);
            // disable if already done, else hide result
            if (validated.includes(name)) {
                checkbox.attrSet('disabled', '');
            } else {
                checkbox.attrs = checkbox.attrs.map(([k, v]) => k == "checked" ? [`data-${k}`, v] : [k, v]);
            }
        }
    }
};
// convert ?[name](value) into HTML input
const inputRule = (validated) => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children.map(child => {
        const matches = [...child.content.matchAll(/\?\[(.*?)\]\((.*?)\)/g)];
        console.debug(matches); //TODO: bug on single word ?!
        return matches.length ? matches.map(([_, content, value]) => [
            new state.Token("label_open", "label", 1),
            Object.assign(new state.Token("text_input", "input", 0), {
                attrs: [
                    [validated.includes('h' + hashCode(value)) ? "disabled" : "readonly", ""],
                    ["class", content],
                    [validated.includes('h' + hashCode(value)) ? "value" : "data-value", value],
                    ["name", 'h' + hashCode(value)]
                ]
            }),
            //Object.assign(new state.Token("text", "", 0), { content }),
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
const ls2json = (res) => res.map(file => ({
    id: file.name,
    title: file.name.slice(0, -3).replace(/\[.*?\]/g, '').trim(),
    icon: (file.name.match(/\[icon:(.*?)\]/)||['','lesson'])[1],
    tags: file.name.match(/\[.*?\]/g).map(tag => tag.slice(1, -1))
}))

const LessonShow = {
    props: ['id'],
    template: `
    <form class=lesson @click=listen @input.prevent=validate v-html="markdownToHtml"></form>
    <router-link :to=$router.options.history.state.back class="button outline">&lt;&lt; Back</router-link>`,
    data() { return { lesson: {} } },
    computed: {
        markdownToHtml() {
            const progress = Object.keys(JSON.parse(localStorage.progress || '{}'));
            const mi = markdownit({ html: true });
            mi.core.ruler.push("media", mediaRule());
            mi.core.ruler.push("checkbox", checkboxRule());
            mi.core.ruler.push("input", inputRule(progress));
            mi.core.ruler.push("exam", listCheckboxRule(progress));
            const html = mi.render(this.lesson || '...');
            return html;
        }
    },
    methods: {
        async listen({ target }) {
            if (!(target.classList.contains("voice") || (target.classList.contains("voiceth")))) return;
            if (!navigator.mediaDevices) {
                return alert("No microphone found (blocked?)");
            }
            const endpoint = target.classList.contains("voiceth") ? '/offerth' : '/offeren';
            target.value = '';
            target.placeholder = 'Connecting...';
            const pc = new RTCPeerConnection({ sdpSemantics: 'unified-plan' });
            const dc = pc.createDataChannel('result');
            dc.onmessage = (messageEvent) => {
                target.classList.add('live');
                target.placeholder = "Speak...";
                const voskResult = JSON.parse(messageEvent.data || '{}');
                const base = target.value.replace(/ *\(.*?\)/, '');
                if (voskResult.text) {
                    target.value = `${base} ${voskResult.text}`.trim();
                    target.dispatchEvent(new Event("input", { bubbles: true }));
                } else if (voskResult.partial) {
                    target.value = `${base} (${voskResult.partial})`.trim();
                }
            };
            target.onblur = function () {
                if (!target.classList.contains('live')) return; // already stopped
                dc?.close();
                pc.getTransceivers?.().forEach((t) => t.stop?.());
                pc.getSenders().forEach((s) => s.track.stop());
                setTimeout(() => pc.close(), 500);
                target.classList.remove('live');
            }
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            await pc.setLocalDescription(await pc.createOffer());
            while (pc.iceGatheringState !== 'complete') await new Promise(r => setTimeout(r, 500));
            const offer = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type }),
            }).then((res) => res.json());
            await pc.setRemoteDescription(offer);
            // stop listening after 5 seconds to avoid flooding
            setTimeout(target.onblur, 5000);
        },
        validate({ target }) {
            const inputs = target.form[target.name];
            let correct = false;
            if (inputs.constructor == HTMLInputElement) {
                correct = inputs.dataset.value == inputs.value;
            }
            if (inputs.constructor == RadioNodeList) {
                // bad/incomplete try : shall we tell student ? it break the point of multiple responses...
                if (target.dataset.checked === undefined) {
                    console.log("wrong answer");
                }
                correct = [...inputs].every(c => c.checked == (c.dataset.checked !== undefined));
            }
            if (!correct) return;
            const progress = JSON.parse(localStorage.progress || '{}');
            progress[target.name] = 1;
            (inputs.length ? inputs : [inputs]).forEach(c => c.disabled = true);
            const remain = target.form.querySelector('input:not([disabled])');
            if (!remain) {
                progress[decodeURIComponent(location.pathname)] = 1;
                setTimeout(this.$router.back, 1000)
            }
            Object.assign(new Audio(remain ? '/static/question.ogg' : '/static/quizz.ogg'), { volume: .1 }).play()
            this.$root.progress = progress;
            localStorage.progress = JSON.stringify(progress);
        }
    },
    async mounted() {
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
        <h1 class=text-capitalize>{{group.title}}</h1>
        <div class=grid>
            <router-link v-for="lesson in group.list" :to="'/lesson/'+lesson.id" :class="'ovh '+reachable(lesson)">
                <span style="text-align:center" v-for="tag in lesson.tags.filter(l=>l.startsWith('level:'))" :class="'tag is-small ' + ((reachable(lesson)=='forbidden')?'bg-error text-light':'text-success')">{{tag}}</span>
                <img :src="'/media/icons/'+lesson.icon+'.svg'" style="padding: 15%;" alt="cover">
                <span class="text-capitalize is-center">{{lesson.title}}</span>
            </router-link>
        </div>
    </template>
    `,
    methods: {
        level(lesson) {
            return +(lesson.tags.find(l => l.startsWith('level:')) || 'level:0').slice("level:".length)
        },
        reachable(lesson) {
            if (this.level(lesson) > this.$root.level(this.$root.xp))
                return 'forbidden';
            if (JSON.parse(localStorage.progress)[`/lesson/${lesson.id}`] !== undefined)
                return 'done card';
            return 'card'
        }
    },
    data() { return { groups: null } },
    watch: {
        tag: {
            handler: async function (tag) {
                const lessons = await (await fetch(`/media/md`)).json();
                this.groups = ls2json(lessons) // fill missing group tag in lesson, group them by they group, sort group and lessons
                    .filter(lesson => lesson.tags.includes(`category:${tag}`))
                    .map(lesson => ({ ...lesson, group: (lesson.tags.find(tag => tag.startsWith('group:')) || 'group:0').substring('group:'.length) }))
                    .reduce(function (groups, lesson) {
                        const existing = groups.find(group => group.path == lesson.group);
                        existing ? existing.list.push(lesson) : groups.push({
                            title: lesson.group.replace(/^[^a-zA-Z]+/, ''),
                            path: lesson.group,
                            list: [lesson]
                        })
                        return groups
                    }, [])
                    .sort((a, b) => a.path.localeCompare(b.path)) // sort groups by they numbered named
                    .map(group => ({
                        ...group, list: group.list // sort grouped lessons by they level + name
                            .sort((a, b) => a.title.localeCompare(b.title))
                            .sort((a, b) => this.level(a) - this.level(b))
                    }))
            },
            immediate: true
        }
    }
}

const CategoriesList = {
    __doc__: `List "category:" tags from all lessons`,
    template: `
    <progress v-if="categories===null"></progress>
    <p v-else-if="categories.length===0">No category found.</p>
    <div class=grid>
        <router-link v-for="category in categories" :to="'/category/'+category.path" class="card ovh">
            <img :src='"/media/icons/"+category.name+".svg"' style="padding: 15%;" alt="cover">
            <span class="is-center text-capitalize">{{category.name}}</span>
        </router-link >
    </div>
    `,
    data() { return { categories: null } },
    async mounted() {
        const tags = ls2json(await fetch(`/media/md`).then(res => res.json()))
        const cats = new Set(tags.map(lesson => lesson.tags).flat()
            .filter(tag => tag.startsWith('category:'))
            .map(tag => tag.substring('category:'.length))
            .sort());
        this.categories = [...cats].map(path => ({ path, name: path.replace(/^[^a-zA-Z]+/, '') }));
    },
}

export { LessonList, LessonShow, CategoriesList }