const empty = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMEAAAC4CAQAAADwZkAeAAABW0lEQVR42u3RMQEAAACCMO1f2hg+IwJrdK4WIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgAQIEFiBAYAECBBYgQGABAgQWIEBgwbsBnYcAuVYBeaIAAAAASUVORK5CYII='
const shiny = "/media/icons/sparkle.gif"
const Profile = {
	template: `
	<form v-else @input=$event.target.form.submit.disabled=false @submit.prevent=update($event)>
		<h1 style=display:inline-block>{{$root.id}}</h1>
		&nbsp;
		<small class="tag is-large">Level:{{level}}</small>
		<blockquote v-if=delta><s>trophy</s> You have earned +{{delta}} !</blockquote>
		<img :src=overlay style="max-width: 25vmin;margin: auto;display: block;background-repeat:no-repeat;background-image:url(/media/icons/treasure.svg)">
		<div style="position: relative;">
		<progress :value=percent/100 style="height:15vmin;"></progress>
		<span style="position: absolute;top: 50%;left: 50%;transform: translate(-50%, -50%);font-size:5vmin;mix-blend-mode: difference;color: white;">
			{{percent}}%
		</span>
		</div>
		<button class="button error" type=button @click=signOut($event) class=is-full-width><s>logout</s> Sign Out</button>
		<h1>My Profile</h1>
		<label>
			<div>Theme</div>
			<input v-model=me.theme type=color>
		</label>
		<label>
			<div>FirstName</div>
			<input v-model=me.firstname autocomplete=given-name>
		</label>
		<label>
			<div>LastName</div>
			<input v-model=me.lastname autocomplete=family-name>
		</label>
		<label>
			<div>Alias</div>
			<input v-model=me.alias autocomplete=nickname>
		</label>
		<label>
			<div>Birthday</div>
			<input v-model=me.birth type=date autocomplete=bday>
		</label>
		<label>
			<div>Grade</div>
			<input v-model=me.grade type=number>
		</label>
		<hr>
		<button disabled name=submit type=submit class=is-full-width><s>check</s> Update</button>
	</form>
	`,
	data() { return { me: {}, progress: {}, delta: 0} },
	computed: {
		xp() { return Object.keys(this.progress).length },
		level() { return this.xp / 100 | 0 }, //level-up every 100 good response
		percent() { return this.xp % 100 }, // TODO: use log(2) progression instead of linear(100)
		overlay() { return this.delta ? shiny : empty}
	},
	async mounted() {
		if (!this.$root.id) return this.$router.push('/');
		this.me = await (await fetch(`/api/profile/${this.$root.id}`)).json();
		// MERGE and display server<->local delta
		const merge = {...this.me.progress, ...JSON.parse(localStorage.progress || '{}')};
		this.delta = Object.keys(merge).length - Object.keys(this.me.progress).length;
		this.progress = merge;
		localStorage.progress = JSON.stringify(merge);
		if (this.delta) {
			this.me.progress = merge;
			this.update();
		}
	},
	watch: { // update $root style (for display) and localstorage (in case we F5 in another page)
		'me.theme': function (val) { return localStorage.theme = this.$root.theme = val }
	},
	methods: {
		async update(event) {
			this.me = await (await fetch(`/api/profile/${this.$root.id}`, {
				method: 'PUT', body: JSON.stringify(this.me),
				headers: { 'Content-Type': 'application/json', 'Prefer': 'return=representation' }
			})).json();
			if(event)event.target.submit.disabled = true;
		},
		async signOut({ target }) {
			await fetch('/api/rpc/logout');
			setTimeout(() => { // give the browser 1 second to apply cookie flush
				if (document.cookie)
					return alert('Unable to logout\n See: https://gitter.im/begriffs/postgrest?at=62e86c60cf6cfd27af645fb8');
				localStorage.clear();
				this.$root.log();
				this.me.theme = '#126359';
				return this.$router.push('/');
			}, 1000);
		}
	}
}

export { Profile }
