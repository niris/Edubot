const UserForm = {
    template:`<form action=/user>
        <input name=user placeholder=username>
        <input name=pass placeholder=password type=password>
        <input type=submit>
    </form>`,
    data(){return {pieces:[]}},
    async mounted() {
        this.pieces = await this.rest('/piece');
    }
}

const UserList = {
    template:`<ul>
    <li v-for="user in users">
        {{user.name}} (~{{user.id}}) {{user.birth}}
    </li>
    </ul>`,
    data(){return {users:[]}},
    async mounted(){
        this.users = await (await fetch('/api/user')).json()
    }
}

export {UserForm, UserList}
