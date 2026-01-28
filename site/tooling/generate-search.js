const { runSearch } = require('./generate-index');

function main(deps = {}) {
    const runner = deps.runSearch || runSearch;
    runner();
}

if (require.main === module) {
    console.log('开始生成搜索索引...');
    main();
    console.log('搜索索引生成完成。');
}

module.exports = { main };
