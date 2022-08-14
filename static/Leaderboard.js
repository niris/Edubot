const Leaderboard = {
  template: `<h1>Top 10 players</h1>
  <progress v-if=profiles==null />
  <table>
  <thead><tr><th>Name</th><th>Level</th></tr></thead>
  <tbody>
  <tr v-for="profile in profiles">
    <td><s :style="{background:profile.theme,'border-radius': '100%'}">bust</s> <span class="text-capitalize">{{profile.id}}</span> <small v-if="profile.alias">{{profile.alias}}</small></td>
    <td>{{$root.level(Object.keys(profile.progress).length)}} <small>({{Object.keys(profile.progress).length}})</small></td>
  </tr>
  </tobdy>
  </table>
  `,
  data() { return { profiles: null } },
  async mounted() {
    this.profiles = (await (await fetch(`/api/profile`)).json())
      .sort((a,b) => Object.keys(b.progress).length - Object.keys(a.progress).length)
      .slice(0,10)
  }

}
export { Leaderboard }