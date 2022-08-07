const Leaderboard = {
  template: `<h1>Top 10 players</h1>
  <progress v-if=profiles==null />
  <table>
  <thead><tr><th>Name</th><th>Level</th></tr></thead>
  <tbody>
  <tr v-for="profile in profiles">
    <td>{{profile.id}} <small v-if="profile.firstname && profile.lastname">{{profile.firstname}} {{profile.lastname}}</small></td>
    <td>{{Object.keys(profile.progress).length/100|0}}</td>
  </tr>
  </tobdy>
  </table>
  `,
  data() { return { profiles: null } },
  async mounted() {
    this.profiles = (await (await fetch(`/api/profile`)).json())
      .sort((a,b) => Object.keys(a.progress).length - Object.keys(b.progress).length)
      .slice(0,10)
  }

}
export { Leaderboard }