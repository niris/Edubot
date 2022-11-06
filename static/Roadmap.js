const CategoryList = {
    __doc__: `List "category:" tags from all lessons`,
    template: `
    <progress v-if="categories===null"></progress>
    <p v-else-if="categories.length===0">No category found.</p>
    <div class=is-right>
        <router-link :to="'/'" class="button outline"><s>options</s> Level View</router-link>
    </div>
    <div class=grid>
        <router-link v-for="category in categories" :to="'/category/'+category.path" class="card truncate">
            <img :src='"/media/icons/"+category.name+".svg"' style="padding: 15%;" width=500 height=500 alt="category" loading=lazy>
            <span class="is-center text-capitalize">{{category.name}}</span>
        </router-link >
    </div>
    `,
    computed: {
        categories() {
            return [...new Set(this.$root.mds.map(t => t.category))].map(path => ({ path, name: path.replace(/^[^a-zA-Z]+/, '') }));
        },
    },
}

const CategoryGroupList = {
    __doc__: `List Lessons for a given .category and group them by they .group`,
    props: ['category'],
    template: `
    <progress v-if="groups==null"/>
    <p v-else-if="groups.length===0">
        No group/lesson with category {{$props.category}}. You can Import them with
        <pre>make lesson_init</pre>
        then <a href=>refresh</a> this page.
    </p>
    <template v-for="group in groups">
        <div class="title text-capitalize">{{group.title.split(":")[0]}}</div>
        <div class="text-grey">{{group.title.split(":")[1]}}</div>
        <div class=grid>
            <router-link v-for="lesson in group.list" :to="'/lesson/'+lesson.name" :class="'truncate '+reachable(lesson)">
                <span style="text-align:center" :class="'tag is-small ' + ((reachable(lesson)=='forbidden')?'bg-error text-light':'text-success')">{{lesson.level}}</span>
                <img :src="'/media/icons/'+lesson.icon+'.svg'" style="padding: 15%;" width=500 height=500 alt="lesson" loading=lazy>
                <span class="text-capitalize is-center">{{lesson.title.replace(/^[^a-zA-Z]+/, '')}}</span>
            </router-link>
        </div>
    </template>
    `,
    methods: {
        reachable(lesson) {
            if (lesson.level > this.$root.myLv)
                return 'forbidden';
            if (lesson.mode == "exam" && this.$root.myLv == lesson.level && lesson.xp > this.$root.myXp)
                return 'forbidden';
            if (this.$root.progress[`/lesson/${decodeURIComponent(lesson.name)}`] !== undefined)
                return 'done card';
            return 'card'
        }
    },
    computed: {
        groups() {
            return this.$root.mds.filter(lesson => lesson.category == this.category)
                .reduce(function (groups, lesson) {
                    const existing = groups.find(group => group.path == lesson.group);
                    existing ? existing.list.push(lesson) : groups.push({
                        title: (lesson.group || '').replace(/^[^a-zA-Z]+/, ''),
                        path: lesson.group,
                        list: [lesson]
                    })
                    return groups
                }, [])
                .sort((a, b) => a.path.localeCompare(b.path)) // sort groups by they numbered named
                .map(group => ({
                    ...group, list: group.list // sort grouped lessons by they level + name
                        .sort((a, b) => a.title.localeCompare(b.title))
                        .sort((a, b) => a.level - b.level)
                }))
        }
    },
    mounted(){
        this.$root.$refs.bot.say(`Let's enjoy ${this.$props.category.replace(/^\d+/,'')} lessons!`,{bot:true},3000);
    },

}

const Roadmap = {
    __doc__: `List lessons grouped by level`,
    template: `
<div class=is-right>
    <router-link :to="'/category/'" class="button outline"><s>app</s> Category View</router-link>
</div>
<div style="background: radial-gradient(var(--color-lightGrey) 20%, transparent 20%) 50% 0px / 20px 20px repeat-y;">
    <div class="is-center" style="flex-direction:column;background: var(--bg-color);">
        <img class="is-center" width=128 :src="'/media/icons/'+$root.avatar($root.alias)+'.svg'">
        <strong class="text-center text-capitalize" style="font-size: 2em;">{{$root.myId}}</strong>
        <div class="text-center">Lv:{{$root.myLv}}, Xp:{{$root.myXp}}</div>
    </div>
    <template v-for="(world,level) in $root.worlds">
        <div :class='{stages:true,disabled:level>$root.myLv}' :data-title="'Level:'+level">
            <router-link :to="'/lesson/'+lesson.name" v-for="lesson in world.filter(l=>l.mode!='exam')" :class="{stage:true,complete:('/lesson/'+lesson.name) in this.$root.progress}" style="position:relative">
                <img :src="'/media/icons/'+lesson.icon+'.svg'" width=64 height=64 alt="lesson" loading=lazy>
                <img :src="'/media/icons/'+base(lesson.category)+'.svg'" width=32 height=32 alt="cat" loading=lazy style="position:absolute;top:45px;right:-10px;background:var(--bg-color);border-radius:100%;box-shadow:0 1px 2px grey">
                <br>
                <span class="text-capitalize">{{lesson.title}}</span>
            </router-link>
        </div>
        <div class=bosses>
            <router-link :to="'/lesson/'+exam.name" v-for="exam in world.filter(l=>l.mode=='exam')"
                :style="'background-image: conic-gradient(var(--color-success) '+(100*$root.myXp/exam.xp)+'%, #BBB8 0deg)'"
                :class='{boss:true,"is-hidden":(level!=$root.myLv), disabled:(exam.xp>$root.myXp)}'>
                <img :src="'/media/icons/'+((exam.xp>$root.myXp)?'lock':exam.icon)+'.svg'" width=64 height=64 alt="exam" loading=lazy>
            </router-link>
        </div>
    </template>
    <img src="/static/crown.svg">
</div>
`,
    methods:{base(path){return path.replace(/^\d+/,'')}},
    mounted() {
        const pos = document.querySelectorAll('.stages:not(.disabled)');
        if(pos.length)pos[pos.length-1].scrollIntoView({ behavior: 'smooth' })
    },
}
export { Roadmap, CategoryList, CategoryGroupList };