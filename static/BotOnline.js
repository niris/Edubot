import listen from '/static/stt.js'

const welcomeMessage = `How can I help you?
- [Vocab : ฝึกคำศัพท์](#/category/2vocab)
- [Phonics : ฝึกสะกดคำ](#/category/1phonics)
- [Conversation : ฝึกประโยคสนทนา](#/category/3conversation)
- [Grammar : ฝึกไวยากรณ์](#/category/6grammar)
- [Chat with me! : คุยกับ AnglizBot](#)`;


const BotOnlineChat = {
    props:['topic'],
    data: () => ({ logs: [] , greetingTimeout:0, suggestions:["English", "ภาษาไทย"], encourageMsg:["Bravo!","Good job","Well done!"], mode:"normal", welcomeMsg:''}),
    created () {
        this.logs.push({ bot: true, msg: "Welcome !"});
        this.greetingTimeout = setTimeout(() => this.logs=[], 5000);
    },
    computed: {
        last_logs() {return this.logs.slice(-5)}
    },
    watch: { // update $root style (for display) and localstorage (in case we F5 in another page)
		//'$root.progress': function (xp) {this.logs.push({bot:true, msg: this.encourageMsg[Math.floor(Math.random() * this.encourageMsg.length)]});setTimeout(() => this.logs=[], 2000);},
        '$root.result': function(res) {
            if(this.$root.result==false){
                this.logs.push({bot:true, msg:"Try again!"});
                setTimeout(() => this.logs=[], 2000);
            }
            else{
                this.logs.push({bot:true, msg: this.encourageMsg[Math.floor(Math.random() * this.encourageMsg.length)]});
                setTimeout(() => this.logs=[], 2000);
            }
        }
	},
    methods: {
        welcome(){
            this.logs = []
            clearTimeout(this.greetingTimeout)
            //this.logs.push({ bot: true, msg: welcomeMessage});
            this.mode = "welcome"
            this.welcomeMsg = welcomeMessage
            this.greetingTimeout = setTimeout(() => this.logs=[], 5000);
        },
        minimize(){
            clearTimeout(this.greetingTimeout)
            this.welcomeMessage="Let's go!!!";
            setTimeout(() => {this.welcomeMessage=[], 5000;this.mode = "normal"
        });
        },
        async send({ target }) {  
            this.welcomeMessage=[];
            this.mode = "normal";
            clearTimeout(this.greetingTimeout)
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

            const response = await this.classify(msg, 'en');
            this.logs.push({ bot: true, msg: `${response[0]}` })
            setTimeout(() => {if(response[2]){
                this.$router.push({ path: response[2]});
                this.logs = [];
                document.getElementById('msgfeild').blur();
            }}, 1000)
            
        },
        async record({ target }) {
            await listen(target, 3000);
            this.send({target:target.form});
        },
        async classify(text, language_code) {
            const res = await (await fetch(`/bot?${new URLSearchParams({text, language_code})}`)).json()
            console.log(res, res.intent)
            let resMessage = ["OK, let's go!", "Let's go!"]
            let randomMessage = resMessage[Math.floor(Math.random() * resMessage.length)]
            switch (res.intent) {
                case "Vocab":
                    return [randomMessage,0,'/category/2vocab']
                case "Oral":
                    return [randomMessage,0,'/category/1phonics'];
                case "Listening":
                    return [randomMessage,0];
                case "Reading":
                    return [randomMessage,0];
                case "Phonics":
                    return [randomMessage,0,'/category/1phonics'];
                case "Grammar":
                    return [randomMessage,0,'/category/6grammar'];
                case "Conversation":
                    return [randomMessage,0,'/category/3conversation'];        
                case "Skills":
                    return ["What skill do you want to practice ? (อยากฝึกทักษะด้านไหนเอ่ย)",1];
                default:
                    return [res.response,1]
            }
        },
        md: (txt) => markdownit('default').render(txt),
    },
    template: `
    <form class=chatbot @submit.prevent=send>
        <output v-if="mode=='welcome'" class="card bot bg-primary text-white" v-html="md(welcomeMsg)" @click="minimize"></output>
        <output v-for="log in last_logs" :class="'card '+(log.bot?'bot bg-primary text-white':'user')" v-html="md(log.msg)" @click="minimize"></output>
        <details class=field>
            <summary>
            <svg class=bot xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 492 492" @click=welcome>
                <path style="opacity:.7" d="m 119,177 c 0,-11 26,-20 37,-23 24,-7 54,-11 83,-11 29,0 59,4 83,11 11,3 37,12 37,23 l -0,19 63,-25 c 3,-1 5,-3 5,-5 0,-1 -1,-4 -4,-5 L 255,68 c -8,-4 -22,-4 -30,0 L 55,160 c -3,1 -5,3 -4,5 0,1 2,3 5,5 l 63,25 z m 0,0"/>
                <path style="opacity:.7" d="M 241,151 A 138,137 0 0 0 102,289 138,137 0 0 0 241,426 138,137 0 0 0 379,289 138,137 0 0 0 241,151 Z m 54,117 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -107,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
                <path style="opacity:.9" d="m 129,225 c -37,0 -68,30 -68,68 0,37 30,68 68,68 h 211 c 37,0 68,-30 68,-68 0,-37 -30,-68 -68,-68 z m 165,43 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z m -108,0 a 22,22 0 0 1 22,22 22,22 0 0 1 -22,22 22,22 0 0 1 -22,-22 22,22 0 0 1 22,-22 z" />
            </svg>
            </summary>
            <nav>
                <input type=button v-if="logs.length" @click.prevent="logs=[]" class="button icon-only picon" value=times>
                <input type=button @click="record({target:$refs.req})" class="button icon-only picon" value=microphone>
                <input name="req" ref=req placeholder="Question" autocomplete="off" id="msgfeild" @input=minimize @focus="minimize">
                <button class="button icon-only picon">send</button>
            </nav>
        </details>
    </form>`,
}
export { BotOnlineChat }
