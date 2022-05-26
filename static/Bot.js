const face = `M1,8L1,2L2,2L2,0L3,0L3,2L5,2L5,0L6,0L6,2L7,2L7,8`;
const faces = {
    sad: [`${face}M2,4L3,4L3,3M6,4L5,3L5,4M3,5L2,7L6,7L5,5`],
    quiet: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M3,6L3,7L5,7L5,6`],
    happy: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L3,7L5,7L6,5`],
    surprised: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M3,5L3,7L5,7L5,5`],
    speaking: [
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,7L6,7L6,5`,
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,6L2,7L6,7L6,6`,
    ],
    wistle: [
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,6L4,6L4,5`,
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,6L3,6L3,5`,
    ],
    confused: [
        `${face}M2,3L2,4L3,4L3,3M6,5L6,4L5,4L5,5M3,6L3,7L5,7L5,6`
    ],
};
const BotFace = {
    props: { mood: { type: String, default: 'quiet' } },
    data: () => ({ faces, frame: 0 }),
    methods: {
        toSvg: (path) => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" fill="white"><path d="${path}"></path></svg>`
    },
    template: `<img :src=toSvg(faces[mood][frame%faces[mood].length])>`,
    mounted() {
        setInterval(() => this.frame++, 750);
    }
}

const DENSE_MODEL_URL = '/static/models/intent/model.json';
const METADATA_URL = '/static/models/intent/intent_metadata.json';
let cache; // out of Vue wrapping
const BotChat = {
    data: () => ({ moods: Object.keys(faces), mood: 1, logs: [], tf, use }),
    methods: {
        make(mood, time = 1500) {
            this.$refs.face.$props.mood = mood;
            setTimeout(() => this.$refs.face.$props.mood = "quiet", time);
        },
        async send({ target }) {
            const msg = target.req.value;
            if (!cache) {
                const p = await Promise.all([
                    use.load(),
                    tf.loadLayersModel(DENSE_MODEL_URL),
                    fetch(METADATA_URL),
                    fetch('/static/dict.txt'),
                ]);
                cache = {
                    useLoader: p[0],
                    model: p[1],
                    metadata: await p[2].json(),
                    dict: (await p[3].text()).split(/\n/)
                };
            }

            const tokens = await this.wordcut(msg);
            let tokenized_text = tokens.join(" ")

            target.req.value = '';
            this.logs.push({ msg });
            if (msg.match(/(score|level|lv|exp)/i)) {
                const score = JSON.parse(localStorage.exams || '[]').length;
                return this.logs.push({ bot: true, msg: `Your score: **${score}** ~~ruby~~` });
            }
            const classification = await this.classify([tokenized_text]);
            const response = await this.getClassificationMessage(classification);
            setTimeout(() => this.logs.push({ bot: true, msg: `${response}` }), 500)
            this.make(this.moods[this.mood++ % this.moods.length]);
        },
        async classify(sentences) {
            const activations = await cache.useLoader.embed(sentences);
            const prediction = cache.model.predict(activations);
            const predsArr = await prediction.array();
            //const preview = [predsArr[0].slice()];
            //preview.unshift(cache.metadata.labels);
            //console.table(preview);
            tf.dispose([activations, prediction]);
            return predsArr[0];
        },
        async getClassificationMessage(softmaxArr) {
            const THRESHOLD = 0.0;
            const max = Math.max(...softmaxArr);
            const maxIndex = softmaxArr.indexOf(max);
            const intentLabel = cache.metadata.labels[maxIndex];

            if (max < THRESHOLD) {
                return '¯\\_(ツ)_/¯';
            } else {
                return intentLabel
            }
        },
        async wordcut(w) {
            const arr = []
            for (let i = 0; i < w.length;) {
                let sub = []
                cache.dict.forEach(v2 => {
                    if (w[i] + w[i + 1] === v2[0] + v2[1]) sub.push([v2, v2.length])
                })
                sub.sort((a, b) => b[1] - a[1])
                for (let ii = 0; ii < sub.length; ii++) {
                    const l = sub[ii][1] + i
                    const s = w.substring(i, l)
                    if (sub[ii][0] === s) {
                        i = l - 1
                        arr.push(s)
                        ii = sub.length
                    }
                }
                i++
            }
            return arr
        },
        md: (txt) => markdownit('default').render(txt),
    },
    template: `
    <form class=chatbot @submit.prevent=send>
        <output v-for="log in logs" :class="'card '+(log.bot?'bot bg-primary text-white':'user text-grey')" v-html="md(log.msg)"></output>
        <div class=field>
            <BotFace ref=face></BotFace>
            <input name=req placeholder="Question">
        </div>
    </form>`,
    components: { BotFace }
}
export { BotFace, BotChat }
