const test = require('node:test');
const assert = require('node:assert/strict');

const { createMarkdownPipeline } = require('../capabilities/markdown/core/index.js');

function createMarkedStub() {
    const state = {
        options: null,
        parsedInputs: []
    };

    function Renderer() {}

    const markedApi = {
        Renderer,
        parse(markdownText) {
            const safe = String(markdownText || '');
            state.parsedInputs.push(safe);
            return `<p>${safe}</p>`;
        },
        setOptions(options) {
            state.options = options;
        }
    };

    return {
        markedApi,
        state
    };
}

test('pipeline applies transforms in registration order', () => {
    const { markedApi, state } = createMarkedStub();
    const pipeline = createMarkdownPipeline({ marked: markedApi });

    pipeline.registerTransform('append-A', (text) => `${text}A`);
    pipeline.registerTransform('append-B', (text) => `${text}B`);

    const rendered = pipeline.render('X');

    assert.equal(rendered, '<p>XAB</p>');
    assert.equal(state.parsedInputs[0], 'XAB');
    assert.equal(pipeline.getState().markedAvailable, true);
});

test('pipeline installs safe link/image renderer hooks', () => {
    const { markedApi, state } = createMarkedStub();
    const pipeline = createMarkdownPipeline({ marked: markedApi });

    assert.ok(state.options);
    assert.ok(state.options.renderer);
    assert.equal(typeof state.options.renderer.link, 'function');
    assert.equal(typeof state.options.renderer.image, 'function');

    const unsafeLink = state.options.renderer.link('javascript:alert(1)', '', '危险');
    const safeLink = state.options.renderer.link('docs/readme.md', '', '文档');
    const unsafeImage = state.options.renderer.image('javascript:alert(1)', '', '图');

    assert.equal(unsafeLink, '危险');
    assert.match(safeLink, /href="docs\/readme\.md"/);
    assert.equal(unsafeImage, '');

    pipeline.dispose();
    assert.equal(pipeline.getState().disposed, true);
});

test('pipeline falls back to escaped plain rendering without marked', () => {
    const pipeline = createMarkdownPipeline({});
    const rendered = pipeline.render('<script>alert(1)</script>');

    assert.equal(rendered, '&lt;script&gt;alert(1)&lt;/script&gt;');
    assert.equal(pipeline.getState().markedAvailable, false);
});
