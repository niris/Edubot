const face = `M1,8L1,2L2,2L2,0L3,0L3,2L5,2L5,0L6,0L6,2L7,2L7,8`;
const faces = {
    sad: [`${face}M2,4L3,4L3,3M6,4L5,3L5,4M3,5L2,7L6,7L5,5`],
    quiet: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M3,6L3,7L5,7L5,6`],
    happy: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L3,7L5,7L6,5`],
    surprised: [`${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M3,5L3,7L5,7L5,5`],
    speaking: [
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,7L6,7L6,5`,
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,6L2,7L6,7L6,6`,
    ],
    wistle: [
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,6L4,6L4,5`,
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,6L3,6L3,5`,
    ],
    curious: [
        `${face}M2,3L2,4L3,4L3,3M6,5L6,4L5,4L5,5M3,6L3,7L5,7L5,6`
    ],
    crazy: [

    ],
    sick: [
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,7L2,6L6,6L6,5L5,5L5,7L4,7L4,5L3,5L3,7`,
        `${face}M2,3L2,4L3,4L3,3M6,4L6,3L5,3L5,4M2,5L2,6L6,6L6,7L5,7L5,5L4,5L4,7L3,7L3,5`
    ]
    
};
const BotFace = {
    props: { mood: { type: String, default: 'quiet' } },
    data: () => ({ faces, frame: 0 }),
    methods: {
        toSvg: (path) => `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8"><path d="${path}"></path></svg>`
    },
    template: `<img :src=toSvg(faces[mood][frame%faces[mood].length])>`,
    mounted() {
        setInterval(() => this.frame++, 750);
    }
}

export { BotFace }
