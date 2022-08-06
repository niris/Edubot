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

const LessonShow = {
    props: ['id'],
    template: `<form class=lesson @click=listen @input.prevent=validate v-html="markdownToHtml"></form>`,
    data() { return { lesson: {} } },
    computed: {
        markdownToHtml() {
            const mi = markdownit({ html: true });
            mi.core.ruler.push("media", mediaRule());
            mi.core.ruler.push("checkbox", checkboxRule());
            mi.core.ruler.push("input", inputRule(JSON.parse(localStorage.exams || '[]')));
            mi.core.ruler.push("exam", listCheckboxRule(JSON.parse(localStorage.exams || '[]')));
            const html = mi.render(this.lesson.content || '...');
            return html;
        }
    },
    methods: {
        async listen({ target }) {
            if (!(target.classList.contains("voice") || (target.classList.contains("voiceth")))) return;
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
            this.$root.$refs.bot.make('happy');
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
            if (correct) {
                console.log("TODO: POST /api/progress {name} ?");
                localStorage.exams = JSON.stringify(JSON.parse(localStorage.exams || '[]').concat(target.name));
                (inputs.length ? inputs : [inputs]).forEach(c => c.disabled = true);
            }
        }
    },
    async mounted() {
        this.lesson = await (await fetch(`/api/lesson/${this.$props.id}`)).json();
    }
}
//URL.createObjectURL(new Blob(Uint8Array.from(s.content.slice(2).match(/../g),a=>parseInt(a,16)), { type: "image/jpeg" } ))
const LessonList = {
    props: ['tag'],
    template: `
    <p v-if="lessons==null">
        loading
    </p>
    <p v-else-if="lessons.length===0">
        No lesson with tag {{$props.tag}}. You can Import them with
        <pre>make lesson_init</pre>
        then <a href=>refresh</a> this page.
    </p>
    <div class=grid>
            <router-link v-for="lesson in lessons" :to="'/lesson/'+lesson.id" class="card" style="border-radius: 1em">
                <img :src="lesson.icon||'/media/icons/kitchen.png'" style="padding: 15%;" alt="cover">
                <span class="is-center">{{lesson.title}}</span>
            </router-link>
    </div>
    <div v-for="sg in subgroups">
        <h1>{{sg.title}}</h1>
        <div class=grid>
            <router-link v-for="lesson in sg.list" :to="'/lesson/'+lesson.id" class="card" style="border-radius: 1em">
                <img :src="$props.tag=='group:grammar'?'/media/icons/'+sg.title+'.svg':'lesson.icon'" style="padding: 15%;" alt="cover">
                <span class="is-center">{{lesson.title}}</span>
            </router-link>
        </div>
    </div>
    `,
    data() { return { lessons: null, subgroups: null} },
    watch: {
        tag: {
            handler: async function (tag) {
                this.lessons = await (await fetch(`/api/lesson?select=id,title,icon,tags&tags=cs.{${tag}}`)).json();
                //TODO: replace lessons with subgroups or delete it!
                this.subgroups = this.lessons.reduce(function(subgroups,lesson){
                    lesson.tags.filter(tag=>tag.startsWith('subgroup:')).forEach(l=>{
                        let title = l.substring('subgroup:'.length)
                        let existing = subgroups.find(sg=>sg.title==title);
                        if(existing) existing.list.push(lesson);
                        else subgroups.push({title:title,list:[lesson]})
                    })                    
                    return subgroups
                },[])
            },
            immediate: true
        }
    }
}

const CategoriesList = {
    //props: ['tag'],
    template: `
    <div class=grid>
        <router-link  v-for="category in categories" :to="'/category/group:'+category" class="card" style="border-radius: 1em">
            <img :src='"/media/icons/"+category+".svg"' style="padding: 15%;" alt="cover">
            <span class="is-center text-capitalize">{{category}}</span>
        </router-link >
    </div>
    `
    ,
    data() { return { categories: [] } },
    async mounted() {
        const tags = (await (await fetch(`/api/lesson?select=tags&tags=cs.{type:lesson}`)).json()).map(lesson => lesson.tags);
        this.categories = new Set(tags.flat().filter(tag => tag.startsWith('group:')).map(tag => tag.substring('group:'.length)))
    },
}

export { LessonList, LessonShow, CategoriesList }