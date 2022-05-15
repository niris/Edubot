const SignUp = {
	template: `
	<form @submit.prevent=signUp($event)>
		<input required autocomplete=username placeholder="Username" name="id">
		<input required autocomplete=password placeholder="Password" name="pass" type="password">
		<button type=submit class=is-full-width>Create User</button>
	</form>`,
	methods: {
		async signUp({target}) {
			const body = new URLSearchParams(new FormData(target));
			const auth = await fetch('/api/rpc/register', {method:'POST', body});
			if (auth.ok) {
				this.$router.push({ name: "LessonList" });
				setTimeout(()=>this.$root.$data.auth=true, 1000);
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
		async signIn({target}) {
			const body = new URLSearchParams(new FormData(target));
			const auth = await fetch('/api/rpc/login', {method:'POST', body});
			if (auth.ok) {
				this.$router.push({ name: "LessonList" });
				setTimeout(()=>this.$root.$data.auth=true, 1000);
			} else {
				const json = await auth.json();
				alert(json.message);
			}
		}
	}
}

const SignOut = {
	template: `
	<form @submit.prevent=signOut($event)>
		<button type=submit class=is-full-width>SignOut</button>
	</form>`,
	methods: {
		async signOut({target}) {
			const auth = await fetch('/api/rpc/logout');
			if (auth.ok) {
				this.$router.push({ name: "LessonList" });
				setTimeout(()=>this.$root.$data.auth=false, 1000);
			}
		}
	}
}

export { SignUp, SignIn, SignOut}
