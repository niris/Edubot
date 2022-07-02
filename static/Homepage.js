const Homepage = {
    data() { return { status: 0 } },
    template: `
    <h1> Welcome to EduBot </h1>
    <p v-if="status==400">
        Setup the database with:
        <pre>make setup</pre>
        Then <a href=>refresh</a> this page.
    </p>
    <p v-if="status!=400&&!$root.role">
        You must be logged to continue
    </p>
    `,
    async mounted() {
        this.status = ((await fetch('/api')).status);
    }
}

export { Homepage }
