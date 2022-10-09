const Roadmap = {
    template: `
    <div style="background: radial-gradient(var(--color-lightGrey) 20%, transparent 20%) 50% 0px / 50px 50px repeat-y;padding-top: 150px;">
    <template v-for="(world,level) in $root.worlds">
        <div :class='{stages:true,disabled:level>$root.myLv}'>
            <router-link :to="'/lesson/'+lesson.name" v-for="lesson in world.filter(l=>l.mode!='exam')" :class="{stage:true,disabled:('/lesson/'+lesson.name) in this.$root.progress}">
                <img :src="'/media/icons/'+lesson.icon+'.svg'" width=64 height=64 alt="lesson" loading=lazy>
                <span>{{lesson.title}}</span>
            </router-link>
        </div>
        <div class=bosses>
            <router-link :to="'/lesson/'+exam.name" v-for="exam in world.filter(l=>l.mode=='exam')" :class='{boss:true,disabled:(exam.xp>$root.myXp)||(level!=$root.myLv)}'>
                <img :src="'/media/icons/'+exam.icon+'.svg'" width=64 height=64 alt="exam" loading=lazy :title="exam.xp+'>'+$root.myXp">
            </router-link>
        </div >
    </template>
    </div>
    `
}
export { Roadmap };