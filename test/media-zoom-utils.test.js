const { test } = require('node:test');
const assert = require('node:assert/strict');

test('MediaZoomUtils.svgMarkupToDataUrl returns a base64 svg data URI with xmlns', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const MediaZoomUtils = require('../assets/js/media-zoom-utils.js');

    const input = '<svg viewBox="0 0 10 10"><text x="0" y="10">你好</text></svg>';
    const url = MediaZoomUtils.svgMarkupToDataUrl(input);

    assert.ok(url.startsWith('data:image/svg+xml;base64,'));

    const base64 = url.slice('data:image/svg+xml;base64,'.length);
    const decoded = Buffer.from(base64, 'base64').toString('utf8');

    assert.match(decoded, /<svg[^>]+xmlns="http:\/\/www\.w3\.org\/2000\/svg"/);
    assert.match(decoded, />你好</);
});

test('MediaZoomUtils.svgMarkupToDataUrl adds xmlns:xlink when xlink is referenced', () => {
    // eslint-disable-next-line global-require, import/no-dynamic-require
    const MediaZoomUtils = require('../assets/js/media-zoom-utils.js');

    const input = '<svg viewBox="0 0 10 10"><a xlink:href="https://example.com"><text x="0" y="10">Link</text></a></svg>';
    const url = MediaZoomUtils.svgMarkupToDataUrl(input);

    const base64 = url.slice('data:image/svg+xml;base64,'.length);
    const decoded = Buffer.from(base64, 'base64').toString('utf8');

    assert.match(decoded, /xmlns:xlink="http:\/\/www\.w3\.org\/1999\/xlink"/);
});

