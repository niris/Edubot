const Sign = {
	props: ['mode'],
	template: `
	<img src="/static/favicon.svg" style="display:block;margin:5em auto;max-width:25vmin">
	<form v-if="$props.mode=='in' && $root.is(null)" @submit.prevent=sign($event)>
		<h1>Login<small> ลงชื่อเข้าใช้ </small></h1>
		<label>
			<div>Username <small> ชื่อผู้ใช้ </small></div>
			<input required autocomplete=username name="id" autocapitalize="none" placeholder="ชื่อผู้ใช้">
		</label>
		<label>
			<div>Password <small> รหัสผ่าน </small></div>
			<input required autocomplete="current-password" name="pass" autocapitalize="none" type="password" placeholder="รหัสผ่าน">
		</label>
		<p class="is-center"><router-link to="/sign/reset">ลืมรหัสผ่าน</router-link></p>
		<button type=submit class=is-full-width><s>login</s> ลงชื่อเข้าใช้ </button>
		<br><br>
		<p class="is-center">ยังไม่เคยลงทะเบียนไว้ใช่ไหม ?&nbsp;<router-link to="/sign/up">สร้างบัญชีใหม่ได้เลย!</router-link></p>
	</form>

	<form v-if="$props.mode=='reset' && $root.is(null)" @submit.prevent=reset($event)>
		<h1>Reset Password <small>แก้ไขรหัสผ่าน</small></h1>
		<label>
			<div>Username <small>ชื่อผู้ใช้</small></div>
			<input required autocomplete=username name="id" autocapitalize="none">
		</label>
		<label>
			<div>Birthdate<small> วันเกิด </small></div>
			<input required name="birth" autocapitalize="none" type="date">
		</label>
		<label>
			<div>Favorite Food<small> อาหารโปรด </small></div>
			<input required name="secret" autocapitalize="none" type="test" >
		</label>
		<hr>
		<label>
			<div>New password <small> รหัสผ่านใหม่ </small></div>
			<input required name="pass" oninput="form._pass.oninput()" autocapitalize="none" type="password" placeholder="ใส่รหัสผ่านที่ต้องการ">
		</label>
		<label>
			<div>Retype password <small> ป้อนรหัสผ่านใหม่อีกครั้ง </small> </div>
			<input required name="_pass" oninput="setCustomValidity(value===form.pass.value?'':'password missmatch')" autocapitalize="none" type="password" placeholder="ใส่รหัสผ่านอีกครั้งเพื่อยืนยัน">
		</label>
		<br>
		<button type=submit class=is-full-width><s>refresh</s> แก้ไขรหัสผ่าน </button>
	</form>

	<form v-if="$props.mode=='up' && $root.is(null)" @submit.prevent=register($event)>
		<h1>Register <small> ลงทะเบียน </small></h1>
		<label>
			<div>Username <small> ชื่อผู้ใช้ </small></div>
			<input required autocomplete=username name="id" autocapitalize="none" placeholder="ใส่ชื่อผู้ใช้ที่ต้องการ">
		</label>
		<label>
			<div>Password <small> รหัสผ่าน </small></div>
			<input required name="pass" oninput="form._pass.oninput()" autocapitalize="none" type="password" placeholder="ใส่รหัสผ่านที่ต้องการ">
		</label>
		<label>
			<div>Retype Password <small> ป้อนรหัสผ่านอีกครั้ง </small></div>
			<input required name="_pass" oninput="setCustomValidity(value===form.pass.value?'':'password missmatch')" autocapitalize="none" type="password" placeholder="ใส่รหัสผ่านอีกครั้งเพื่อยืนยัน">
		</label>
		<h3> Security Questions <small> คำถามเพื่อความปลอดภัย</small></h3>
		<label>
			<div>Birtdate <small> วันเกิด </small></div>
			<input required name="birth" autocapitalize="none" type="date">
		</label>
		<label>
			<div>Favorite Food <small> อาหารโปรด </small></div>
			<input required name="secret" autocapitalize="none" type="test">
		</label>
		<br>
		<button type=submit class=is-full-width><s>+</s> Register</button>
		<br><br>
		<p class="is-center">เคยลงทะเบียนไว้แล้วใช่ไหม ? &nbsp;<router-link to="/sign/in">ลงชื่อเข้าใช้ได้เลย</router-link></p>
	</form>
	<br>
	<p class="is-center"><router-link to="/privacy">นโยบายความเป็นส่วนตัว (Privacy Policy)</router-link></p>
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
			this.$router.push({ path: '/settings' });// so we can sync progress
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
			alert("New password set ! You can now login. \n รหัสผ่านใหม่ถูกตั้งค่าแล้ว สามารถเข้าใช้งานได้เลย" );
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
			const pro = await fetch(`/api/profile?id=eq.${this.$root.id}`, {
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
			this.$router.push({ path: '/settings' });// so we can sync progress
		},
	}
}

export { Sign }
