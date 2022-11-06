import { syncProgress } from "./Sync.js";
import listen from '/static/stt.js'

// hash a question into a localStorage id
const hashCode = (s,lv) => `lv${lv}/` + s.split('').reduce((a, b) => (a = ((a << 5) - a) + b.charCodeAt(0), a & a), 0);
const pick = (...list) => list[Math.floor(Math.random() * list.length)];
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
            if (all[j].type !== "inline" || all[j].children.length != 4 || !['checkbox_input','radio_input'].includes(all[j].children[1].type)) continue;
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
// convert ( ) label into HTML checkbox
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
// convert ( ) label into HTML radio
const radioRule = () => function (state) {
    state.tokens.filter(t => t.type === "inline").forEach(i => i.children = i.children.map(child => {
        const matches = [...child.content.matchAll(/\((x|X|\s|\*|\_|\-)\)\s([^\[]*)/g)];
        return matches.length ? matches.map(([_, value, content]) => [
            new state.Token("label_open", "label", 1),
            Object.assign(new state.Token("radio_input", "input", 0), { attrs: [["type", "radio"]].concat((value.toLowerCase() === "x") ? [["checked", ""]] : []) }),
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
    data() { return { lesson: "", isExam: false, level:0, validated: Object.keys(this.$root.progress)} },
    computed: {
        markdownToHtml() {
            const mi = markdownit({ html: true });
            mi.use(lazy_img);
            mi.core.ruler.push("media", mediaRule());
            mi.core.ruler.push("checkbox", checkboxRule(this.level));
            mi.core.ruler.push("radio", radioRule(this.level));
            mi.core.ruler.push("input", inputRule(this.validated, this.level));
            mi.core.ruler.push("exam", listCheckboxRule(this.validated, this.level));
            return this.lesson ? mi.render(this.lesson) : '...';
        }
    },
    methods: {
        syncProgress,
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
                return this.$root.$refs.bot.say(`${info}\nBut you need ${(100*bargain)|0}%`);
            }
            this.$root.$refs.bot.say(`${info}\nCongratulation !`);
            Object.assign(new Audio('/static/quizz.ogg'), { volume: .1 }).play()
            valid.forEach(target => this.$root.progress[target.name||target[0].name] = +new Date())
            this.$root.progress[decodeURIComponent(location.hash.replace(/^#/,''))] = +new Date();
            this.syncProgress().then(()=>setTimeout(this.$router.back, 1000));
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
                    this.$root.$refs.bot.say(pick("Oups !", "Try again !"), {bot:true,'text-white':true, 'bg-error':true}, 1500);
                }
                correct = [...inputs].every(c => c.checked == (c.dataset.checked !== undefined));
            }
            if (!correct) return;
            this.$root.progress[target.name] = +new Date();
            (inputs.length ? inputs : [inputs]).forEach(c => c.disabled = true);
            const remain = target.form.querySelector('input:not([disabled])');
            if (!remain) {
                this.$root.progress[decodeURIComponent(location.hash.replace(/^#/,''))] = +new Date();
                this.syncProgress().then(()=>setTimeout(this.$router.back, 1000));
            }
            Object.assign(new Audio(remain ? '/static/question.ogg' : '/static/quizz.ogg'), { volume: .1 }).play()
            this.$root.$refs.bot.say(pick("Bravo!", "Good job", "Well done!"), {bot:true}, 1500);
        }
    },
    async mounted() {
        this.level = +(this.$props.id.match(/\[level:(\d+)\]/)||['','0'])[1];
        this.isExam = this.$props.id.includes('[mode:exam]');
        this.lesson = await (await fetch(`/media/md/${this.$props.id}`)).text();
        this.$root.$refs.bot.say(pick("Enjoy the lesson!", "Let's rock!", "Let's roll!"),{bot:true},1500);
    }
}

export { LessonShow }