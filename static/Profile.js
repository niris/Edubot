const Profile = {
	template: `
	<form v-if=!$root.id>
		<h1><s>brush</s> Theme <small>Make it your own !</small></h1>
		<input v-model=$root.theme type=color>
	</form>
	<h1><s>refresh</s> Online profile<small>Save you progress online and join the <router-link to="/leaderboard">leaderboard</router-link> !</small></h1>
	<div v-if=!$root.id class=row>
		<router-link class="col button success" to="/sign/up">Create Account</router-link>
		<router-link class="col button primary" to="/sign/in">Connect existing account</router-link>
		<router-link class="col button error" to="/sign/reset">Forgotten password</router-link>
	</div>
	<form v-if=profile @input=$event.target.form.submit.disabled=false @submit.prevent=update($event)>
		<label>
			<div>Theme</div>
			<input v-model=profile.theme type=color>
		</label>
		<label>
			<div>Nickname</div>
			<input v-model=profile.alias autocomplete=nickname placeholder="ชื่อ นามสกุล">
		</label>
		<label>
			<div>Birthdate</div>
			<input v-model=profile.birth type=date>
		</label>
		<label>
			<div>Favorite food</div>
			<input v-model=profile.secret type=text>
		</label>
		<hr>
		<div class="row">
			<button type=submit class="col button" disabled name=submit><s>check</s> Update</button>
			<button type=button class="col button error" v-if=$root.id @click=signOut($event)><s>logout</s> Sign Out</button>
		</div>
	</form>
	<h1><s>wifi2</s> Offline Mode<small>Read lessons without internet (voice exam still need internet)</small></h1>
	<div class="row">
		<button class="col button primary" v-if="$root.worker" type=button @click="worker($event,'install')"><s>download</s> Save Lessons</button>
		<button class="col button primary" v-if="$root.worker" type=button @click="worker($event,'remove')"><s>rss</s> Use online</button>
	</div>
`,
	data() { return { profile: null } },
	watch: {
		"profile.theme"() { this.$root.theme = this.profile.theme; }
	},
	mounted() { // making it async will give an incomplete $root after Routing redirection
		if (!this.$root.id) return;
		fetch(`/api/profile/${this.$root.id}`).then(res => res.json()).then(json => {
			this.profile = json;
			// MERGE and display server<->local delta
			const merge = { ...this.profile.progress, ...this.$root.progress };
			this.$root.progress = merge;
			if (Object.keys(merge).length != Object.keys(this.profile.progress).length) {
				this.$root.$refs.bot.say("Your progress is now online !")
				this.update();
				new Audio('/static/level.ogg').play();
			}
		}).catch(() => this.profile = null);
	},
	methods: {
		worker({ target }, action) {
			target.disabled = true;
			this.$root.worker.postMessage({ action });
			target.disabled = false;
		},
		async update(event) {
			this.profile = await (await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT', body: JSON.stringify(this.profile),
				headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
			})).json();
			if (event) event.target.submit.disabled = true;
		},
		async signOut({ target }) {
			await fetch('/api/rpc/logout');
			localStorage.clear();
			this.$root.log();
			this.profile.theme = '';
			return this.$router.push('/');
		}
	}
}

export { Profile }
