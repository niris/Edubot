const empty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMEAAAC4CAQAAADwZkAeAAABW0lEQVR42u3RMQEAAACCMO1f2hg+IwJrdK4WIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgwbsBnYcAuVYBeaIAAAAASUVORK5CYII='
const shiny = "/media/icons/sparkle.gif"
const Profile = {
	template: `
	<form v-else @input=$event.target.form.submit.disabled=false @submit.prevent=update($event)>
		<div class="row">
		<button class="col button" v-if="quiet" type=button @click=mute()><s>louder</s> unmute</button>
		<button class="col button" v-if="!quiet" type=button @click=mute()><s>volume</s> mute</button>
		<button class="col button primary" v-if="me && $root.worker" type=button @click="worker($event,'install')"><s>download</s> Store Lessons</button>
		<button class="col button primary" v-if="me && $root.worker" type=button @click="worker($event,'remove')"><s>broom</s> Flush Lesson</button>
		<button class="col button error" v-if=me type=button @click=signOut($event)><s>logout</s> Sign Out</button>
		</div>
		<template v-if=me>
		<h1>My profile</h1>
		<label>
			<div>Nickname</div>
			<input v-model=me.alias autocomplete=nickname placeholder="ชื่อ นามสกุล">
		</label>
		<label>
			<div>Theme</div>
			<input v-model=me.theme type=color>
		</label>
		<details>
			<summary>Password reset info</summary>
			<label>
				<div>Birthdate</div>
				<input v-model=me.birth type=date>
			</label>
			<label>
				<div>Favorite food</div>
				<input v-model=me.secret type=text>
			</label>
		</details>
		<hr>
		<button disabled name=submit type=submit class=is-full-width><s>check</s> Update</button>
		</template>
	</form>
	`,
	data() { return { me: {}, quiet:localStorage.quiet||'', delta: 0, localStorage, context: null, amp:{}, oldXp:-1} },
	computed: {
		overlay() { return this.delta ? shiny : empty },
		percent() {
			const lv = this.level(this.$root.xp);
			return 1 - ((this.$root.levels[lv+1] - this.$root.xp)/(this.$root.levels[lv+1] - this.$root.levels[lv]))
		},
	},
	unmounted() {
		if (this.context) {
			this.context.suspend();
			this.context.close();
			this.context = null;
		}
	},
	mounted() { // making it async will give an incomplete $root after Routing redirection
		if (!this.$root.id)
			return this.$router.push('/');
		fetch(`/api/profile/${this.$root.id}`).then(res => res.json()).then(json => {
			this.me = json;
			// MERGE and display server<->local delta
			const merge = { ...this.me.progress, ...JSON.parse(localStorage.progress || '{}') };
			this.delta = Object.keys(merge).length - Object.keys(this.me.progress).length;
			this.$root.progress = merge;
			localStorage.progress = JSON.stringify(merge);
			if (this.delta) {
				this.me.progress = merge;
				this.update();
				new Audio('/static/level.ogg').play();
			}
		}).catch(() => this.me = null);
	},
	watch: { // update $root style (for display) and localstorage (in case we F5 in another page)
		'me.theme': function (val) { return localStorage.theme = this.$root.theme = val || '#126359' },
		'$root.progress': function (xp) {this.audio()},
	},
	methods: {
		worker({target}, action){
			target.disabled = true;
			this.$root.worker.postMessage({action});
			target.disabled = false;
		},
		mute(){
			this.quiet = this.quiet ? '': '1'; // keep it as string for localstorage
			localStorage.quiet = this.quiet;
			this.audio(true);
		},
		audio(restart=false) {
			if (restart || !this.context || this.context.state == 'suspended' ||
				this.level(this.oldXp) != this.level(this.$root.xp)) {
				if (this.context) {
					this.context.suspend()
					this.context.close()
					this.context = null;
				}
				this.oldXp = this.$root.xp;
				this.context = new AudioContext();
				const gain = this.context.createGain();
				gain.connect(this.context.destination);
				gain.gain.value = this.quiet ? 0 : 0.1;
				const source = this.context.createBufferSource();
				source.connect(gain);
				fetch('/static/lv' + this.level(this.$root.xp) + '.ogg')
				.then(res => res.arrayBuffer())
				.then(buf => this.context.decodeAudioData(buf))
				.then(dec => {
					source.buffer = dec;
					source.start(0); // cannot be started without prior interaction
					source.loop = true;
				});
			}
		},
		wide() {
			this.$refs.scene.requestFullscreen();
			this.audio();
		},
		level(xp) { return this.$root.level(xp); },
		async update(event) {
			this.me = await (await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT', body: JSON.stringify(this.me),
				headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
			})).json();
			if (event) event.target.submit.disabled = true;
		},
		async signOut({ target }) {
			await fetch('/api/rpc/logout');
			localStorage.clear();
			this.$root.log();
			this.me.theme = '#126359';
			return this.$router.push('/');
		}
	}
}

export { Profile }
