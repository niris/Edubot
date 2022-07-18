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
				this.$router.push("/");
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

const bootstrap = '{}';
const headers = { 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
const SignMe = {
	template: `
	<h1 style=display:inline-block>{{$root.id}}</h1>
	&nbsp;
	<small class="tag">{{$root.role}}</small>
	<form @submit.prevent=update($event)>
		<label>
			<span>Name</span>
			<input v-model=name>
		</label>
		<label>
			<span>Birthday</span>
			<input v-model=birth type=date>
		</label>
		<button type=submit class=is-full-width>Update</button>
	</form>
	<div style="display:grid;grid-template-columns: 1fr auto 1fr; grid-gap: 20px;padding: 20px 0;">
		<div>Progress::Local</div>
		<br>
		<div>Progress::Server</div>
		<textarea v-model=local style="width:unset"></textarea>
		<div style=display:grid>
		<button @click.prevent="local=server">&lt;&lt;</button>
		<button @click.prevent="server=local">&gt;&gt;</button>
		</div>
		<textarea v-model=server style="width:unset" disabled></textarea>
	</div>
	<form @submit.prevent=signOut($event)>
		<button type=submit class=is-full-width><s>logout</s> Sign Out</button>
	</form>`,
	data() { return { name: null, birth: null, server: null, local: localStorage.progress } },
	watch: {
		local(progress) { localStorage.progress = progress },
		server(progress) {
			fetch(`/api/user/${this.$root.id}`, { method: 'PATCH', headers, body: JSON.stringify({ progress }) })
				.then(e => e.json()).then(json => this.apply([json]));
		},
	},
	async mounted() {
		let req = await fetch(`/api/user/${this.$root.id}`);
		if (req.status != 200) {
			const body = JSON.stringify({ progress: bootstrap });
			this.apply(await (await fetch('/api/user', { method: 'POST', headers, body })).json());
		} else {
			this.apply([await req.json()]);
		}
	},
	methods: {
		apply(json) {
			[{ progress: this.server, name: this.name, birth: this.birth }] = json;
		},
		async update({ target }) {
			fetch(`/api/user/${this.$root.id}`, { method: 'PATCH', headers, body: JSON.stringify({ name:this.name, birth:this.birth }) })
				.then(e => e.json()).then(json => this.apply([json]));
		},
		async signOut({ target }) {
			const auth = await fetch('/api/rpc/logout');
			if (auth.ok) {
				this.$root.log();//setTimeout(()=>this.$root.$data.auth=false, 1000);
				this.$router.push("/");
			}
		}
	}
}

export { SignUp, SignIn, SignMe }
