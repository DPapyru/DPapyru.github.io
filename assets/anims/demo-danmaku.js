export default async function run(ctx) {
    ctx.danmaku.send('弹幕演示：欢迎来到 TS 动画系统', { lane: 0, durationMs: 6500 });
    await ctx.wait(600);
    for (let i = 0; i < 10; i++) {
        if (ctx.signal && ctx.signal.aborted)
            return;
        ctx.danmaku.send(`第 ${i + 1} 条弹幕`, { lane: i % 6, durationMs: 5200 });
        await ctx.wait(450);
    }
}
//# sourceMappingURL=demo-danmaku.js.map