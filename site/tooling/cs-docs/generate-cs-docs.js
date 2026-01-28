const { runGenerator } = require('./cs-docs');

function main(deps = {}) {
    const runner = deps.runGenerator || runGenerator;
    runner({ rootDir: 'site/content' });
}

if (require.main === module) {
    console.log('开始生成 C# 文档...');
    main();
    console.log('C# 文档生成完成。');
}

module.exports = { main };
