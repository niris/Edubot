const Leaderboard = {
  template: `<h1 style="font-weight:bold;line-height:1;text-align:center;">Top 10 players</h1>
  <progress v-if=profiles===undefined />
  <blockquote v-if=profiles===null>Impossible to get the list</blockquote>
  <table>
  <tbody>
  <tr v-for="profile in profiles">
    <td><s :style="{color:profile.theme}">bust</s> <span class="text-capitalize">{{profile.id}}</span> <small v-if="profile.alias">{{profile.alias}}</small></td>
    <td>{{$root.level(Object.keys(profile.progress).length)}} <small>({{Object.keys(profile.progress).length}})</small></td>
  </tr>
  </tobdy>
  </table>
  `,
  data() { return { profiles: undefined } },
  async mounted() {
    try {
      this.profiles = (await (await fetch(`/api/leaderboard`)).json())
        .sort((a, b) => Object.keys(b.progress).length - Object.keys(a.progress).length)
        .slice(0, 10)
    } catch (e) {
      this.profiles = null;
    }

  }

}
export { Leaderboard }