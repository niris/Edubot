import { syncProgress } from "./Sync.js";
const Profile = {
	template: `
	<h1><s>heart</s> Avatar <small>เลือกรูปที่ชอบ Just like you !</small></h1>
	<div class=is-center>
	<img class=card width=128 :src="'/media/icons/'+$root.avatar($root.alias)+'.svg'" @click=shuffleAvatar>
	</div>
	<h1><s>brush</s> Theme <small> เลือกสีที่ชอบ Make it your own ! </small></h1>
	<input v-model=$root.theme type=color>
	<h1><s>america</s> Online profile<small>เข้าสู่ระบบออนไลน์เพื่อสนุกกับเพื่อนๆใน <router-link to="/leaderboard">Leaderboard</router-link> !</small></h1>
	<div v-if=!$root.id class=row>
		<router-link class="col button success" to="/sign/up"><s>+</s> สร้างบัญชีผู้ใช้ใหม่</router-link>
		<router-link class="col button primary" to="/sign/in"><s>login</s> ลงชื่อเข้าใช้</router-link>
	</div>
	<form v-if=profile @submit.prevent=syncProgress({birth:profile.birth,secret:profile.secret})>
		<label>
			<div>Birthdate  <small> วันเกิด </small></div>
			<input v-model=profile.birth type=date>
		</label>
		<label>
			<div>Favorite Food  <small> อาหารโปรด </small></div>
			<input v-model=profile.secret type=text>
		</label>
		<hr>
		<div class="row">
			<button type=submit class="col button"><s>apart</s> อัพเดทโปรไฟล์ </button>
			<button type=button class="col button error" @click=signOut()><s>logout</s> ออกจากระบบ </button>
		</div>
	</form>
	<h1 v-if="$root.worker"><s>wifi0</s> Offline Mode<small>เก็บบทเรียนไว้ใช้เมื่อไม่มีอินเทอร์เน็ต </small></h1>
	<div v-if="$root.worker" class="row">
		<button class="col button primary" type=button @click="worker($event,'install')"><s>download</s> บันทึกบทเรียน </button>
		<button class="col button primary" type=button @click="worker($event,'remove')"><s>rss</s> ใช้งานออนไลน์ </button>
	</div>
`,
	data() { return { profile: null } },
	watch: {
		"profile.theme"() { if (this.profile && this.profile.theme) this.$root.theme = this.profile.theme; }
	},
	mounted() { // making it async will give an incomplete $root after Routing redirection
		if (!this.$root.id) {
			this.$root.$refs.bot.say("**Save your progress!**  \nอยากบันทึกความก้าวหน้าไว้ไหม?  \n[ลงทะเบียนหรือลงชื่อเข้าใช้ได้เลย](#/sign/up)", {bot:true}, 3000);
		}
		this.syncProgress().then(merge => this.profile = merge||this.profile);
	},
	methods: {
		syncProgress,
		shuffleAvatar() {
			const list = [...Array(18).fill().map((c, i) => `boy-${i}`), ...Array(20).fill().map((c, i) => `girl-${i}`)];
			this.$root.alias = list[Math.floor(Math.random() * list.length)];
		},
		worker({ target }, action) {
			target.disabled = true;
			this.$root.worker.postMessage({ action });
			target.disabled = false;
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
