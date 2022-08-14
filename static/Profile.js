const empty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMEAAAC4CAQAAADwZkAeAAABW0lEQVR42u3RMQEAAACCMO1f2hg+IwJrdK4WIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgwbsBnYcAuVYBeaIAAAAASUVORK5CYII='
const shiny = "/media/icons/sparkle.gif"
const Profile = {
	template: `
	<form v-else @input=$event.target.form.submit.disabled=false @submit.prevent=update($event)>
	<div @click="wide()":data-delta="delta||null" ref=scene :style="' user-select: none;padding: 1em; animation: hscrolling 60s ease-in-out 0s infinite; animation-timing-function: steps(300, end); background-position: 0 50%;  image-rendering: pixelated;background-image: url(/static/profile/lv'+$root.level($root.xp)+'.gif); background-size: cover; border-radius:1em'">
		<img alt=treasure :src=overlay  style="max-width: 25vmin;margin: auto;display: block;background-repeat:no-repeat;background-image:url(/media/icons/treasure.svg)">
		<div style="display: grid;grid-template-columns: 4fr;">
		<progress style="grid-row: 1/1; grid-column: 1;height:15vmin;opacity:.8; margin: auto; width: 50%;" :value=percent></progress>
		<span     style="grid-row: 1/1; grid-column: 1;font-size:5vmin;text-align: center;align-self: center;mix-blend-mode: difference;color: white;">
			Lv:{{$root.level($root.xp)}}
		</span>
		</div>
	</div>
		<button class="button error" type=button @click=signOut($event) class=is-full-width><s>logout</s> Sign Out</button>
		<h1>My Profile</h1>
		<label>
			<div>Nickname</div>
			<input v-model=me.alias autocomplete=nickname placeholder="ชื่อ นามสกุล">
		</label>
		<label>
			<div>Theme</div>
			<input v-model=me.theme type=color>
		</label>
		<label>
			<div>Grade</div>
			<input v-model=me.grade type=number>
		</label>
		<button @click="for(var i=0;i< 1;i++)me.progress[Math.random()]=0;localStorage.progress=JSON.stringify($root.progress=me.progress);update();">xp {{$root.xp}}+=1</button>
		<button @click="for(var i=0;i<50;i++)me.progress[Math.random()]=0;localStorage.progress=JSON.stringify($root.progress=me.progress);update();">xp {{$root.xp}}+=50</button>
		<button @click="localStorage.progress=JSON.stringify($root.progress=me.progress={});update();">xp=0</button>
		<hr>
		<button disabled name=submit type=submit class=is-full-width><s>check</s> Update</button>
	</form>
	`,
	data() { return { me: {}, delta: 0, localStorage, context: null, oldXp:-1} },
	computed: {
		overlay() { return this.delta ? shiny : empty },
		percent() { return (this.$root.xp - Math.pow(2, this.$root.level(this.$root.xp))) / Math.pow(2, this.$root.level(this.$root.xp)) },
	},
	unmounted() {
		this.context.suspend()
		this.context.close()
		this.context = null;
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
		});
	},
	watch: { // update $root style (for display) and localstorage (in case we F5 in another page)
		'me.theme': function (val) { return localStorage.theme = this.$root.theme = val },
		'$root.progress': function (xp) {this.audio()},
	},
	methods: {
		audio() {
			if (!this.context || this.context.state == 'suspended' ||
				this.$root.level(this.oldXp) != this.$root.level(this.$root.xp)) {
				if (this.context) {
					this.context.suspend()
					this.context.close()
					this.context = null;
				}
				this.oldXp = this.$root.xp;
				this.context = new AudioContext();
				const gain = this.context.createGain();
				gain.connect(this.context.destination);
				gain.gain.value = 0.1;
				const source = this.context.createBufferSource();
				source.connect(gain);
				fetch('/static/profile/lv' + this.$root.level(this.$root.xp) + '.ogg')
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
		async update(event) {
			this.me = await (await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT', body: JSON.stringify(this.me),
				headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
			})).json();
			if (event) event.target.submit.disabled = true;
		},
		async signOut({ target }) {
			await fetch('/logout'); // because /api/rpc/logout : https://gitter.im/begriffs/postgrest?at=62e86c60cf6cfd27af645fb8
			localStorage.clear();
			this.$root.log();
			this.me.theme = '#126359';
			return this.$router.push('/');
		}
	}
}

export { Profile }
