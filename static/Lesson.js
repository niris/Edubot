const examRule = (validated) => function (state) {
    const all = state.tokens;
    for (let i = 0; i < all.length; i++) {
        // search for a paragraph-prefixed bullet list
        if (i < 1 || all[i].type !== "bullet_list_open" || all[i - 1].type !== "paragraph_close") continue;
        // extract it prefix text
        const name = 'h'+hashCode(all[i - 2].content);
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
const hashCode = s => s.split('').reduce((a, b) => (a = ((a << 5) - a) + b.charCodeAt(0), a & a), 0);
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
    template: `<form class=lesson @change.prevent=validate v-html="markdownToHtml"></form>`,
    data() { return { lesson: {} } },
    computed: {
        markdownToHtml() {
            const mi = markdownit('default');
            mi.core.ruler.push("checkbox", checkboxRule());
            mi.core.ruler.push("media", mediaRule());
            mi.core.ruler.push("exam", examRule(JSON.parse(localStorage.exams||'[]')));
            const html = mi.render(this.lesson.content || '...');
            return html;
        }
    },
    methods: {
        validate({ target }) {
            this.$root.$refs.bot.make('happy');
            if (target.form[target.name].constructor != RadioNodeList) {
                return console.log("Only 1 choice ?!");
            }
            // bad/incomplete try : shall we tell student ? it break the point of multiple responses...
            if (target.dataset.checked === undefined) {
                console.log("wrong answer");
            }
            const choices = [...target.form[target.name]];
            const correct = choices.every(c => c.checked == (c.dataset.checked!==undefined));
            if (correct) {
                console.log("TODO: POST /api/progress {name} ?");
                localStorage.exams = JSON.stringify(JSON.parse(localStorage.exams||'[]').concat(target.name));
                choices.forEach(c=>c.disabled=true);
            }
        }
    },
    async mounted() {
        this.lesson = await (await fetch(`/api/lesson/${this.$props.id}`)).json();
    }
}
//URL.createObjectURL(new Blob(Uint8Array.from(s.content.slice(2).match(/../g),a=>parseInt(a,16)), { type: "image/jpeg" } ))
const LessonList = {
    template: `<h1>Lessons List</h1>
    <small v-if="!lessons.length">No lessons. Import some examples using the <kbd>./dataset.sh</kbd> script</small>
    <ul v-for="l in lessons">
        <li>
            <router-link :to="''+l.id">{{l.title}}</router-link> by {{l.owner}}
            <small class=tag v-if=l.draft>draft</small>
        </li>
    </ul>`,
    data() { return { lessons: [] } },
    async mounted() {
        this.lessons = await (await fetch(`/api/lesson?select=id,title,owner,draft`)).json();
    }
}

export { LessonList, LessonShow }
