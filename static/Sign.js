const Sign = {
	template: `
	<form v-if="$root.is(null)" @submit.prevent=sign($event)>
		<img src="/static/favicon.svg" style="display:block;margin:5em auto;max-width:25vmin">
		<label>
			<div>Username</div>
			<input required autocomplete=username name="id" autocapitalize="none">
		</label>
		<label>
			<div>Password</div>
			<input required autocomplete=password name="pass" autocapitalize="none" type="password">
		</label>
		<hr>
		<button type=submit class=is-full-width>Sign In</button>
		<p class="is-center">See our &nbsp;<router-link to="/privacy">Privacy policy</router-link>.</p>
	</form>
	`,
	mounted() {
		if (this.$root.id) return this.$router.push('/');
	},
	methods: {
		async sign({ target }) {
			const body = new URLSearchParams(new FormData(target));
			let auth = await fetch('/api/rpc/register', { method: 'POST', body });
			if (auth.status == 409) {
				auth = await fetch('/api/rpc/login', { method: 'POST', body });
			} else {
				alert(`User ${body.username} created !`);
			}
			if (auth.ok) {
				this.$root.log();//setTimeout(()=>this.$root.$data.auth=true, 1000);
				this.$router.push({ path: '/me' });
			} else {
				const json = await auth.json();
				alert(json.message);
			}
		}
	}
}

export { Sign }
