const SignUp = {
    data() {
        return { // TODO: use color + number as password
            numbers: [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39],
            colors: [0xF00, 0x0F0, 0x00F, 0xFF0, 0x0FFF, 0xFFF, 0x000],
        }
    },
    template: `<form action=/user>
        <input name=id required>
        <button type=submit>Sign Up</button>
    </form>`
}

const SignIn = {
    props: { range: { default: 'none' }, id: { type: Number, default: 0 } },
    template: `<div class=row>range={{range}} id={{id}}
        <a class="card col-4" is=router-link :to="{name:'PieceNew'}">Create</a>
        <div class="card col-4" v-for="p in plays">
            <a is=router-link :to="{name:'PieceForm', params:{id:p.piece_id}}">{{p.piece_id}}</a>
            {{p.date}} {{p.time}}
            <span v-for="a in p.actors">@{{a}} </span>
        </div>
        </div>`,
    data() { return { plays: [] } },
    async mounted() {
        this.plays = await this.rest('/play')
    }
}

export { SignUp, SignIn }
