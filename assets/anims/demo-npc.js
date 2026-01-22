export default async function run(ctx) {
    ctx.npc.say({ name: 'Guide', text: '这里是 NPC 对话演示。', durationMs: 2200 });
    await ctx.wait(900);
    ctx.npc.say({ name: 'Guide', text: '动画脚本来自 docs/anims/*.ts，并在构建时编译到 assets/anims/*.js。', durationMs: 3800 });
    await ctx.wait(1200);
    ctx.danmaku.send('（你也可以混合弹幕 + NPC）', { lane: 2, durationMs: 5600 });
}
//# sourceMappingURL=demo-npc.js.map