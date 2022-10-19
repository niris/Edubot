const Leaderboard = {
  template: `
  <progress v-if=profiles===undefined />
  <blockquote v-if=profiles===null>Impossible to get the list</blockquote>
  <div class=podium v-if=profiles>
    <div v-for="(profile,i) in profiles.slice(0,3)" :style="{transform: 'translateY('+i*1.5+'em)'}">
      <img width=92 :src="'/media/icons/'+$root.avatar(profile.alias)+'.svg'">
      <div class="text-capitalize text-center">
        <strong style="display:block">{{profile.id}}</strong>
        {{profile.lv}} ({{profile.xp}})
      </div>
    </div>
  </div>
  <img src="/static/podium.svg" style="max-height: 100px;margin: auto;display: block;">
  <hr style="margin:4em">
  <table v-if=profiles>
  <tbody>
  <tr v-for="profile in profiles.slice(3)">
    <td width=32><img width=32 :src="'/media/icons/'+$root.avatar(profile.alias)+'.svg'"></td>
    <th class="text-capitalize" :style="{color:profile.theme}">{{profile.id}}</th>
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