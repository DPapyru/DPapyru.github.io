const { runStructure } = require('./generate-index');

function main(deps = {}) {
    const runner = deps.runStructure || runStructure;
    runner();
}

if (require.main === module) {
    console.log('开始生成站点结构...');
    main();
    console.log('站点结构生成完成。');
}

module.exports = { main };
