async function syncProgress(extra={}) {
    // fetch user online profile
    if (!this.$root.id) {
        return null;
    }
    const [remote] = await fetch(`/api/profile?id=eq.${this.$root.id}`).then(res => res.json());
    if (!Object.keys(extra).length && Object.keys(remote.progress).length == Object.keys(this.$root.progress).length) {
        return remote;
    }
    // delta between remote-local => MERGE remote into local progress
    this.$root.progress = { ...remote.progress, ...this.$root.progress, ...extra};
    // hydrate the to-be-sent profile
    Object.assign(remote, {theme: this.$root.theme, alias:this.$root.alias, progress: this.$root.progress}, extra);
    const headers = { 'Content-Type': 'application/json', 'Prefer': 'return=representation' };
    const args = { method: 'PUT', headers, body: JSON.stringify(remote) };
    const [final] = await fetch(`/api/profile?id=eq.${this.$root.id}`, args).then(res => res.json())
    new Audio('/static/level.ogg', { volume: .05 }).play();
    this.$root.$refs.bot.say("ความก้าวหน้าถูกบันทึกแล้ว");
    console.log(this.$root.progress, final.progress);
    return final;
}
export {syncProgress};