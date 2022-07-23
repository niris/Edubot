const SignUp = {
	template: `
	<form @submit.prevent=signUp($event)>
		<input required autocomplete=username placeholder="Username" name="id">
		<input required autocomplete=password placeholder="Password" name="pass" type="password">
		<button type=submit class=is-full-width>Create User</button>
	</form>`,
	methods: {
		async signUp({ target }) {
			const body = new URLSearchParams(new FormData(target));
			const auth = await fetch('/api/rpc/register', { method: 'POST', body });
			if (auth.ok) {
				this.$root.log();//setTimeout(()=>this.$root.$data.auth=true, 1000);
				this.$router.push("/me");
			} else {
				const json = await auth.json();
				alert(json.message);
			}
		}
	}
}

const SignIn = {
	template: `
	<form @submit.prevent=signIn($event)>
		<input required autocomplete=username placeholder="Username" name="id">
		<input required autocomplete=password placeholder="Password" name="pass" type="password">
		<button type=submit class=is-full-width>Sign In</button>
	</form>
	`,
	methods: {
		async signIn({ target }) {
			const body = new URLSearchParams(new FormData(target));
			const auth = await fetch('/api/rpc/login', { method: 'POST', body });
			if (auth.ok) {
				this.$root.log();//setTimeout(()=>this.$root.$data.auth=true, 1000);
				this.$router.push("/");
			} else {
				const json = await auth.json();
				alert(json.message);
			}
		}
	}
}

const SignMe = {
	template: `
	<h1 style=display:inline-block>{{$root.id}}</h1>
	&nbsp;
	<small class="tag">{{$root.role}}</small>
	<form @submit.prevent=update($event)>
		<label>
			<span>FirstName</span>
			<input v-model=me.firstname autocomplete=given-name>
		</label>
		<label>
			<span>LastName</span>
			<input v-model=me.lastname autocomplete=family-name>
		</label>
		<label>
			<span>Alias</span>
			<input v-model=me.alias autocomplete=nickname>
		</label>
		<label>
			<span>Birthday</span>
			<input v-model=me.birth type=date autocomplete=bday>
		</label>
		<label>
			<span>Grade</span>
			<input v-model=me.grade type=number>
		</label>
		<div style="display:grid;grid-template-columns: 1fr auto 1fr; grid-gap: 20px;padding: 20px 0;">
		<div>Progress::Local</div>
		<br>
		<div>Progress::Server</div>
		<textarea style="width:unset" disabled>{{progress}}</textarea>
		<div style=display:grid>
		<button @click.prevent="progress = me.progress">&lt;&lt;</button>
		<button @click.prevent="me.progress = progress">&gt;&gt;</button>
		</div>
		<textarea style="width:unset" disabled>{{me.progress}}</textarea>
		</div>
		<button type=submit class=is-full-width><s>check</s> Update</button>
		<hr>
		<button type=button @click=signOut($event) class=is-full-width><s>logout</s> Sign Out</button>
	</form>
	`,
	data() { return { me: {}, progress: JSON.parse(localStorage.progress || '{}') } },
	async mounted() {
		this.me = await (await fetch(`/api/profile/${this.$root.id}`)).json();
	},
	watch: {
		progress: (val) => localStorage.setItem("progress", JSON.stringify(val))
	},
	methods: {
		async update({ target }) {
			const ret = await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT', body: JSON.stringify(this.me),
				headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
			});
			this.me = await ret.json();
		},
		async signOut({ target }) {
			const auth = await fetch('/api/rpc/logout');
			if (auth.ok) {
				delete localStorage.progress; // flush local storage to avoid giving progress to next logged user
				this.$root.log();//setTimeout(()=>this.$root.$data.auth=false, 1000);
				this.$router.push("/");
			}
		}
	}
}

export { SignUp, SignIn, SignMe }
