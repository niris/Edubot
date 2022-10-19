const Leaderboard = {
  template: `
  <progress v-if=profiles===undefined />
  <blockquote v-if=profiles===null>Impossible to get the list</blockquote>
  <div class=podium v-if=profiles style="display: flex;justify-content: center;">
    <div v-for="(profile,i) in profiles.slice(0,3)" :style="{transform: 'translateY('+i*32+'px)'}">
      <img width=92 :src="'/media/icons/'+$root.avatar(profile.alias)+'.svg'">
      <div class="text-capitalize text-center">{{profile.id}}: {{profile.lv}} ({{profile.xp}})</div>
    </div>
  </div>
  <img src="/static/podium.svg">
  <table v-if=profiles>
  <tbody>
  <tr v-for="profile in profiles.slice(3)">
    <td><s :style="{color:profile.theme}">bust</s> <span class="text-capitalize">{{profile.id}}</span></td>
    <td>Lv:{{profile.lv}} Xp:{{profile.xp}}</td>
  </tr>
  </tobdy>
  </table>
  `,
  data() { return { profiles: undefined } },
  async mounted() {
    try {
      this.profiles = (await (await fetch(`/api/leaderboard`)).json())
        .map(profile => ({...profile, lv:this.$root.lv(profile.progress), xp:this.$root.xp(profile.progress)}))
        .sort((a, b) => b.xp - a.xp)
        .sort((a, b) => b.lv - a.lv)
        .slice(0, 10)
    } catch (e) {
      this.profiles = null;
    }
  }
}
export { Leaderboard }