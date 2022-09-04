const Sign = {
	props: ['mode'],
	template: `
	<img src="/static/favicon.svg" style="display:block;margin:5em auto;max-width:25vmin">
	<form v-if="$props.mode=='in' && $root.is(null)" @submit.prevent=sign($event)>
		<h1>Login</h1>
		<label>
			<div>Username</div>
			<input required autocomplete=username name="id" autocapitalize="none">
		</label>
		<label>
			<div>Password</div>
			<input required autocomplete="current-password" name="pass" autocapitalize="none" type="password">
		</label>
		<p class="is-center"><router-link to="/sign/reset">I forgot my password</router-link>.</p>
		<button type=submit class=is-full-width><s>login</s> Sign In</button>
		<br><br>
		<p class="is-center">No account ?&nbsp;<router-link to="/sign/up">register</router-link>.</p>
	</form>

	<form v-if="$props.mode=='reset' && $root.is(null)" @submit.prevent=reset($event)>
		<h1>Reset</h1>
		<label>
			<div>Username</div>
			<input required autocomplete=username name="id" autocapitalize="none">
		</label>
		<label>
			<div>Birthday</div>
			<input required name="birth" autocapitalize="none" type="date">
		</label>
		<label>
			<div>Favorite food</div>
			<input required name="secret" autocapitalize="none" type="test">
		</label>
		<hr>
		<label>
			<div>New Password</div>
			<input required name="pass" oninput="form._pass.oninput()" autocapitalize="none" type="password">
		</label>
		<label>
			<div>New Password (again)</div>
			<input required name="_pass" oninput="setCustomValidity(value===form.pass.value?'':'password missmatch')" autocapitalize="none" type="password">
		</label>
		<br>
		<button type=submit class=is-full-width><s>refresh</s> Reset</button>
	</form>

	<form v-if="$props.mode=='up' && $root.is(null)" @submit.prevent=register($event)>
		<h1>Register</h1>
		<label>
			<div>Username</div>
			<input required autocomplete=username name="id" autocapitalize="none">
		</label>
		<label>
			<div>Password</div>
			<input required name="pass" oninput="form._pass.oninput()" autocapitalize="none" type="password">
		</label>
		<label>
			<div>Password (again)</div>
			<input required name="_pass" oninput="setCustomValidity(value===form.pass.value?'':'password missmatch')" autocapitalize="none" type="password">
		</label>
		<h4 class=is-center>Security question (in case of password lost)</h4>
		<label>
			<div>Birthday</div>
			<input required name="birth" autocapitalize="none" type="date">
		</label>
		<label>
			<div>Favorite food</div>
			<input required name="secret" autocapitalize="none" type="test">
		</label>
		<br>
		<button type=submit class=is-full-width><s>+</s> Register</button>
		<br><br>
		<p class="is-center">Already have an account ?&nbsp;<router-link to="/sign/in">sign in</router-link>.</p>
	</form>
	<br>
	<p class="is-center">See our &nbsp;<router-link to="/privacy">Privacy policy</router-link>.</p>
	`,
	mounted() {
		if (this.$root.id) return this.$router.push('/');
	},
	methods: {
		async sign({ target }) {
			const auth = await fetch('/api/rpc/login', {
				method: 'POST',
				body: new URLSearchParams(new FormData(target)),
			});
			if (!auth.ok) {
				return alert((await auth.json()).message);
			}
			this.$root.log();
			this.$router.push({ path: '/me' });
		},
		async reset({ target }) {
			const auth = await fetch('/api/rpc/reset', {
				method: 'POST',
				body: new URLSearchParams({
					id: target.id.value,
					pass: target.pass.value,
					birth: target.birth.value,
					secret: target.secret.value,
				}),
			});
			if (!auth.ok) {
				return alert((await auth.json()).message);
			}
			alert("New password set ! You can now login.");
			this.$router.push({ path: '/sign/in' });
		},
		async register({ target }) {
			const auth = await fetch('/api/rpc/register', {
				method: 'POST',
				body: new URLSearchParams({
					id:target.id.value,
					pass:target.pass.value
				})
			});
			if (!auth.ok) {
				return alert((await auth.json()).message);
			}
			this.$root.log();
			// also update profile info right away
			const pro = await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT',
				body: new URLSearchParams({
					id: this.$root.id,
					secret:target.secret.value,
					birth:target.birth.value
				}),
			});
			if (!pro.ok) {
				return alert((await pro.json()).message);
			}
			// setup all done
			alert(`Welcome ${this.$root.id} !`);
			this.$router.push({ path: '/me' });
		},
	}
}

export { Sign }
