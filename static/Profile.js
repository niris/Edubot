const Profile = {
	template: `
	<h1><s>heart</s> Avatar <small>Just like you !</small></h1>
	<div class=is-center>
	<img class=card width=128 :src="'/media/icons/'+$root.avatar($root.alias)+'.svg'" @click=shuffleAvatar>
	</div>
	<h1><s>brush</s> Theme <small>Make it your own !</small></h1>
	<input v-model=$root.theme type=color>
	<h1><s>america</s> Online profile<small>Save you progress online and join the <router-link to="/leaderboard">leaderboard</router-link> !</small></h1>
	<div v-if=!$root.id class=row>
		<router-link class="col button success" to="/sign/up">Create Account</router-link>
		<router-link class="col button primary" to="/sign/in">Connect existing account</router-link>
		<router-link class="col button error" to="/sign/reset">Forgotten password</router-link>
	</div>
	<form v-if=profile @submit.prevent=update(profile,$event)>
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
			<button type=submit class="col button"><s>apart</s> Synchronize</button>
			<button type=button class="col button error" @click=signOut()><s>logout</s> Sign Out</button>
		</div>
	</form>
	<h1 v-if="$root.worker"><s>wifi0</s> Offline Mode<small>Read lessons without internet (voice exam still need internet)</small></h1>
	<div v-if="$root.worker" class="row">
		<button class="col button primary" type=button @click="worker($event,'install')"><s>download</s> Save Lessons</button>
		<button class="col button primary" type=button @click="worker($event,'remove')"><s>rss</s> Use online</button>
	</div>
`,
	data() { return { profile: null } },
	watch: {
		"profile.theme"() { if (this.profile && this.profile.theme) this.$root.theme = this.profile.theme; }
	},
	mounted() { // making it async will give an incomplete $root after Routing redirection
		if (!this.$root.id) return;
		fetch(`/api/profile?id=eq.${this.$root.id}`).then(res => res.json()).then(([profile]) => {
			this.profile = profile;
			// MERGE and display server<->local delta
			const merge = { ...this.profile.progress, ...this.$root.progress };
			this.$root.progress = merge;
			if (Object.keys(this.profile.progress).length != Object.keys(merge).length) {
				this.update({ ...this.profile, progress: merge });
			}
		});
	},
	methods: {
		shuffleAvatar() {
            const list = [...Array(18).fill().map((c,i)=>`boy-${i}`), ...Array(20).fill().map((c,i)=>`girl-${i}`)];
            this.$root.alias = list[Math.floor(Math.random()*list.length)];
        },
		worker({ target }, action) {
			target.disabled = true;
			this.$root.worker.postMessage({ action });
			target.disabled = false;
		},
		update(profile) {
			profile.theme = this.$root.theme;
			profile.alias = this.$root.alias;
			const headers = { 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
			fetch(`/api/profile?id=eq.${this.$root.id}`, { method: 'PUT', headers, body: JSON.stringify(profile) })
				.then(res => res.json()).then(([profile]) => {
					this.profile = profile;
					this.$root.progress = profile.progress;
					new Audio('/static/level.ogg', { volume: .1 }).play();
					this.$root.$refs.bot.say("Progress synchronized !");
				});
		},
		async signOut() {
			await fetch('/api/rpc/logout');
			this.$root.log(); // take cookie flush into account
			localStorage.clear();
			this.$root.progress = {};
			this.profile = null;
		}
	}
}

export { Profile }
