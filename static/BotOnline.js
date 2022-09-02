const BotOnlineChat = {
    data: () => ({ logs: [] }),
    created () {
        setTimeout(() => this.logs.push({ bot: true, msg: "AnglizBot Hello!" }), 500);
        this.audio();
    },
    computed: {
        last_logs() {return this.logs.slice(-3)}
    },
    methods: {
        log: console.log,
        async send({ target }) {
            const msg = target.req.value;

            target.req.value = '';

            if (msg.match(/(score|level|lv|exp)/gi)) {
                const score = Object.keys(JSON.parse(localStorage.progress || '{}')).length;
                return this.logs.push({ bot: true, msg: `Your score: **${score}** ~~ruby~~` });
            }
            /*if (msg.match(/(แปลประโยค|แปล|แปลว่าอะไร|แปลว่า|ความหมายของ)/i)) {
                const regex = /[A-z]+/gi;
                const word = msg.match(regex)
                console.log(word)
                return this.logs.push({ bot: true, msg: word.join(" ") + " แปลว่า" });
            }*/
            else
                this.logs.push({ msg });

            const response = await this.classify(msg, 'th');
            setTimeout(() => this.logs.push({ bot: true, msg: `${response[0]}` }), 500);
            if(response[1] == 0) this.logs = []
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
                if (!target.classList.contains('live')) return; // already stopped
                dc?.close();
                pc.getTransceivers?.().forEach((t) => t.stop?.());
                pc.getSenders().forEach((s) => s.track.stop());
                setTimeout(() => pc.close(), 500);
                target.disabled = false;
                target.classList.remove('live');
                send({ target: target.form });
            }
            if (!navigator.mediaDevices && location.protocol == 'http:')
                return alert("Media access is only possible in HTTPS !");
            if (!navigator.mediaDevices)
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
        async classify(text, language_code) {
            const res = await (await fetch(`/dialog?${new URLSearchParams({text, language_code})}`)).json()
            console.log(res, res.intent)
            switch (res.intent) {
                case "Vocab":
                    const restvocab = ["ไปฝึกศัพท์กันเลย", "โอเค!!!ไปฝึกศัพท์กันเลย", "Let's go!!!!!"]
                    this.$router.push({ path: '/category/2vocab' });
                    return [restvocab[Math.floor(Math.random() * restvocab.length)],0];
                case "Oral":
                    const restoral = ["ไปฝึกพูดกันเลย", "โอเค!!!ไปฝึกพูดกันเลย", "Let's go!!!!!"]
                    this.$router.push({ path: '/category/1phonics' });
                    return [restoral[Math.floor(Math.random() * restoral.length)],0];
                case "Skills":
                    return ["ไม่ทราบว่าอยากฝึกทักษะด้านไหน",1];
                default:
                    return [res.response,1]
            }
        },
        md: (txt) => markdownit('default').render(txt),
        audio() {
            //console.log("audio!")
            var audio = new Audio('http://soundbible.com/mp3/Elevator Ding-SoundBible.com-685385892.mp3');
            audio.muted = true;
            //console.log(audio)
            //audio.play()
		}
    },
    template: `
    <form class=chatbot @submit.prevent=send>
        <output v-for="log in last_logs" :class="'card '+(log.bot?'bot bg-primary text-white':'user text-grey')" v-html="md(log.msg)"></output>
        <details class=field>
            <summary>
            <svg class=bot xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 492 492">
                <path style="opacity:.7" d="m 119,177 c 0,-11 26,-20 37,-23 24,-7 54,-11 83,-11 29,0 59,4 83,11 11,3 37,12 37,23 l -0,19 63,-25 c 3,-1 5,-3 5,-5 0,-1 -1,-4 -4,-5 L 255,68 c -8,-4 -22,-4 -30,0 L 55,160 c -3,1 -5,3 -4,5 0,1 2,3 5,5 l 63,25 z m 0,0"/>
                <path style="opacity:.7" d="M 241,151 A 138,137 0 0 0 102,289 138,137 0 0 0 241,426 138,137 0 0 0 379,289 138,137 0 0 0 241,151 Z m 54,117 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -107,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
                <path style="opacity:.9" d="m 129,225 c -37,0 -68,30 -68,68 0,37 30,68 68,68 h 211 c 37,0 68,-30 68,-68 0,-37 -30,-68 -68,-68 z m 165,43 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -108,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
            </svg>
            </summary>
            <nav>
                <input type=button v-if="logs.length" @click.prevent="logs=[]" class="button icon-only picon" value=flush>
                <input type=button @click="listen({target:$refs.req})" class="button icon-only picon" value=microphone>
                <input name="req" ref=req placeholder="Question">
                <button class="button icon-only picon">send</button>
            </nav>
        </details>
    </form>`,
}
export { BotOnlineChat }
