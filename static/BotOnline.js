import listen from '/static/stt.js'

function reply_code(md) {
    var defaultCodeRenderer = md.renderer.rules.code_inline;
    md.renderer.rules.code_inline = function (tokens, idx, options, env, self) {
        tokens[idx].attrSet('onclick', 'chat(innerText)');
        return defaultCodeRenderer(tokens, idx, options, env, self);
    };
};

const BotOnlineChat = {
    data: () => ({ logs: [], hidden: true }),
    mounted() {
        this.chat("Hello", false);
        window.chat = this.chat; // so JS can call it from dialogflow
    },
    methods: {
        say(msg, opts = { bot: true }, timeout = 5000) {
            const at = this.logs.push({ msg, classes: { card: true, ...opts }, timeout });
            setTimeout(() => this.logs[at - 1].classes.hidden = true, timeout);
        },
        action_redirect(path) {
            this.$router.push({ path });
        },
        async chat(text, echo = true) {
            const query = new URLSearchParams({ text, language_code: 'en' });
            if (echo) {
                this.say(text, { user: true });
            }
            try {
                const res = await fetch(`/bot?${query}`).then(res => res.json());
                console.log(res);
                this.hidden = false;
                for (const text of (res.queryResult.fulfillmentMessages || []).map(msg => msg?.text?.text?.[0])) {
                    const [_, action, params] = text.match(/^\$(\w+)?:(.*)$/) || ['', '', ''];
                    if (action) {
                        this[`action_${action}`](params);
                    } else {
                        this.say(text);
                    }
                }
            } catch (e) {
                console.log("error with bot, hide it", e);
                this.hidden = true;
            }
        },
        async record({ target }) {
            await listen(target, 3000);
            this.chat(target.req.value).then(() => target.reset());
        },
        md: (txt) => markdownit('default').use(reply_code).render(txt),
    },
    template: `
    <form class=chatbot @submit.prevent="chat($event.target.req.value);$event.target.reset();" :hidden=hidden>
        <output v-for="log in logs" :class=log.classes v-html="md(log.msg)"></output>
        <details class=field open>
            <summary>
            <svg class=bot xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 492 492">
                <path style="opacity:.7" d="m 119,177 c 0,-11 26,-20 37,-23 24,-7 54,-11 83,-11 29,0 59,4 83,11 11,3 37,12 37,23 l -0,19 63,-25 c 3,-1 5,-3 5,-5 0,-1 -1,-4 -4,-5 L 255,68 c -8,-4 -22,-4 -30,0 L 55,160 c -3,1 -5,3 -4,5 0,1 2,3 5,5 l 63,25 z m 0,0"/>
                <path style="opacity:.7" d="M 241,151 A 138,137 0 0 0 102,289 138,137 0 0 0 241,426 138,137 0 0 0 379,289 138,137 0 0 0 241,151 Z m 54,117 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -107,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
                <path style="opacity:.9" d="m 129,225 c -37,0 -68,30 -68,68 0,37 30,68 68,68 h 211 c 37,0 68,-30 68,-68 0,-37 -30,-68 -68,-68 z m 165,43 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -108,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
            </svg>
            </summary>
            <nav>
                <input type=button @click="record({target:$refs.req})" class="button icon-only picon" value=microphone>
                <input name=req ref=req placeholder="Question" autocomplete="off">
                <button class="button icon-only picon">send</button>
            </nav>
        </details>
    </form>`,
}
export { BotOnlineChat }
