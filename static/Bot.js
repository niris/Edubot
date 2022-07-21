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
    template: `<img width=64 height=64 :alt=mood :src=toSvg(faces[mood][frame%faces[mood].length])>`,
    mounted() {
        setInterval(() => this.frame++, 750);
    }
}

const DENSE_MODEL_URL = '/static/models/intent/model.json';
const METADATA_URL = '/static/models/intent/intent_metadata.json';
let cache; // out of Vue wrapping
const loadScript = (src) => new Promise(function (onload, onerror) {
    document.head.appendChild(Object.assign(document.createElement('script'), {src, onload, onerror}));
});
const BotChat = {
    data: () => ({ moods: Object.keys(faces), mood: 1, logs: []}),
    methods: {
        log: console.log,
        make(mood, time = 1500) {
            this.$refs.face.$props.mood = mood;
            setTimeout(() => this.$refs.face.$props.mood = "quiet", time);
        },
        async send({ target }) {
            const msg = target.req.value;
            if(!window.tf)await loadScript('/static/tfjs.js');
            if(!window.use)await loadScript('/static/universal-sentence-encoder.js');
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
        async listen({ target }) {
            const send = this.send;
            const endpoint = '/offerth';
            target.value = '';
            target.placeholder = 'Connecting...';
            const pc = new RTCPeerConnection({ sdpSemantics: 'unified-plan' });
            const dc = pc.createDataChannel('result');
            dc.onmessage = (messageEvent) => {
                target.classList.add('live');
                target.placeholder = "Speak...";
                target.disabled = true;
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
                if(!target.classList.contains('live'))return; // already stopped
                dc?.close();
                pc.getTransceivers?.().forEach((t) => t.stop?.());
                pc.getSenders().forEach((s) => s.track.stop());
                setTimeout(() => pc.close(), 500);
                target.disabled = false;
                target.classList.remove('live');
                send({target:target.form});
            }
            if(!navigator.mediaDevices && location.protocol == 'http:')
                return alert("Media access is only possible in HTTPS !");
            if(!navigator.mediaDevices)
                return alert("Forbidden Media access !")
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            stream.getTracks().forEach((t) => pc.addTrack(t, stream));
            await pc.setLocalDescription(await pc.createOffer());
            while (pc.iceGatheringState !== 'complete') await new Promise(r => setTimeout(r, 500));
            try {
                const offer = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sdp: pc.localDescription.sdp, type: pc.localDescription.type }),
                }).then((res) => res.json());
                await pc.setRemoteDescription(offer);
                // stop listening after 5 seconds to avoid flooding
            } catch {
                alert('Voice server unreachable. Please restart voice server');
            }
            setTimeout(target.onblur, 5000);
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
        <details class=field>
            <summary><BotFace ref=face></BotFace></summary>
            <nav>
                <input type=button v-if="logs.length" @click.prevent="logs=[]" class="button icon-only picon" value=flush>
                <input type=button @click="listen({target:$refs.req})" class="button icon-only picon" value=microphone>
                <input name="req" ref=req placeholder="Question">
                <button class="button icon-only picon">send</button>
            </nav>
        </details>
    </form>`,
    components: { BotFace }
}
export { BotFace, BotChat }
