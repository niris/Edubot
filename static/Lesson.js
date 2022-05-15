// convert [ ] label into HTML checkbox
const checkboxRule = () => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children.map(child => {
        const matches = [...child.content.matchAll(/\[(x|X|\s|\*|\_|\-)\]\s([^\[]*)/g)];
        return matches.length ? matches.map(([_, value, content]) => [
            new state.Token("label_open", "label", 1),
            Object.assign(new state.Token("checkbox_input", "input", 0), { attrs: [["type", "checkbox"], (value.toLowerCase() === "x") ? ["checked", ""] : []] }),
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
        .map(img => img.type == "image" && img.nesting == 1 ? [img, new state.Token("image_close", img.tag, -1)]:[img]).flat());
};

const LessonShow = {
    props: ['id'],
    template: `<form class=lesson v-html="markdownToHtml"></form>`,
    data() { return { lesson: {} } },
    computed: {
        markdownToHtml() {
            const mi = markdownit('default');
            mi.core.ruler.push("checkbox", checkboxRule());
            mi.core.ruler.push("media", mediaRule());
            return mi.render(this.lesson.content || '...');
        }
    },
    async mounted() {
        this.lesson = await (await fetch(`/api/lesson/${this.$props.id}`)).json();
    }
}
//URL.createObjectURL(new Blob(Uint8Array.from(s.content.slice(2).match(/../g),a=>parseInt(a,16)), { type: "image/jpeg" } ))
const LessonList = {
    template: `<h1>Lessons List</h1>
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
