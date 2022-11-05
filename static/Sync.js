async function syncProgress() {
    // fetch user online profile
    console.log("syncProgress", this.$root.id);
    if (!this.$root.id) {
        this.$root.$refs.bot.say("[ลงทะเบียนหรือลงชื่อเข้าใช้](#/sign/up) เพื่อบันทึกความก้าวหน้า");
        return null;
    }
    const [remote] = await fetch(`/api/profile?id=eq.${this.$root.id}`).then(res => res.json());
    if (Object.keys(remote.progress).length == Object.keys(this.$root.progress).length)
        return remote;
    // delta between remote-local => MERGE remote into local progress
    this.$root.progress = { ...remote.progress, ...this.$root.progress };
    remote.theme = this.$root.theme;
    remote.alias = this.$root.alias;
    remote.progress = this.$root.progress;
    const headers = { 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    const args = { method: 'PUT', headers, body: JSON.stringify(remote) };
    const [final] = await fetch(`/api/profile?id=eq.${this.$root.id}`, args).then(res => res.json())
    new Audio('/static/level.ogg', { volume: .05 }).play();
    this.$root.$refs.bot.say("ความก้าวหน้าถูกบันทึกแล้ว");
    console.log(this.$root.progress, final.progress);
    return final;
}
export {syncProgress};