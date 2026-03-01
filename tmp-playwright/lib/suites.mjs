function firstTruthy(value) {
    return value !== null && value !== undefined && value !== '';
}

async function findFirstSelector(page, candidates) {
    return page.evaluate((selectors) => {
        for (const selector of selectors) {
            if (document.querySelector(selector)) return selector;
        }
        return '';
    }, candidates);
}

async function waitIdeReady(page) {
    await page.waitForFunction(() => {
        return Boolean(
            globalThis.__tmlIdeDebug
            && globalThis.__tmlIdeDebug.isReady
            && globalThis.__tmlIdeDebug.isReady()
        );
    }, null, { timeout: 30000 });
    await page.waitForSelector('#editor .monaco-editor', { timeout: 30000 });
}

async function addWorkspaceFile(page, fileName) {
    const dialogs = [];
    const handler = async (dialog) => {
        dialogs.push(dialog.message());
        if (dialog.type() === 'prompt') {
            await dialog.accept(fileName);
            return;
        }
        await dialog.dismiss();
    };
    page.once('dialog', handler);
    await page.click('#btn-add-file');
    await page.waitForTimeout(200);
    if (!dialogs.length) {
        throw new Error(`新增文件对话框未出现: ${fileName}`);
    }
}

async function ensureIdeFiles(page, fileNames) {
    await waitIdeReady(page);
    const existing = await page.evaluate(() => {
        return Array.from(document.querySelectorAll('#file-list .file-item')).map((node) => {
            const labelNode = node.querySelector('.repo-tree-label');
            if (labelNode) {
                return String(labelNode.textContent || '').trim();
            }
            const raw = String(node.textContent || '').trim();
            return raw.replace(/\s*[AMD]\s*$/, '');
        });
    });
    for (const fileName of fileNames) {
        if (existing.includes(fileName)) continue;
        await addWorkspaceFile(page, fileName);
    }
}

function buildViewerScenarios() {
    return [
        {
            id: 'viewer-search-input',
            run: async ({ page, step, assert }) => {
                await step('wait-viewer-mounted', async () => {
                    await page.waitForTimeout(1200);
                });

                const sidebarSelector = await findFirstSelector(page, [
                    '#category-sidebar .shared-page-tree-link',
                    '#category-sidebar .learn-tree-link',
                    '#category-sidebar a'
                ]);

                await step('input-sidebar-search', async () => {
                    const search = page.locator('#sidebar-quick-search');
                    const exists = await search.count();
                    assert('viewer-search-input-exists', exists > 0, 'missing #sidebar-quick-search');
                    await search.click();
                    await search.fill('武器');
                    await page.waitForTimeout(300);
                    const current = await search.inputValue();
                    assert('viewer-search-input-value', current === '武器', current);
                });

                await step('assert-sidebar-links', async () => {
                    const count = sidebarSelector ? await page.locator(sidebarSelector).count() : 0;
                    assert('viewer-sidebar-links-positive', count > 0, String(count));
                });
            }
        },
        {
            id: 'viewer-sidebar-click',
            run: async ({ page, step, assert }) => {
                await step('click-first-sidebar-link', async () => {
                    const selector = await findFirstSelector(page, [
                        '#category-sidebar .shared-page-tree-link',
                        '#category-sidebar .learn-tree-link',
                        '#category-sidebar a'
                    ]);
                    assert('viewer-sidebar-selector-found', firstTruthy(selector), selector);
                    const links = page.locator(selector);
                    const count = await links.count();
                    assert('viewer-sidebar-link-count', count > 0, String(count));
                    await links.first().click();
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForTimeout(1000);
                });

                await step('assert-viewer-url-after-click', async () => {
                    const url = page.url();
                    assert('viewer-url-has-file-param', /\/site\/pages\/viewer\.html\?file=/.test(url), url);
                });
            }
        },
        {
            id: 'viewer-outline-click',
            run: async ({ page, step, assert }) => {
                await step('click-first-outline-link', async () => {
                    const selector = await findFirstSelector(page, [
                        '#table-of-contents .shared-article-outline-link',
                        '#table-of-contents a'
                    ]);
                    assert('viewer-outline-selector-found', firstTruthy(selector), selector);
                    const links = page.locator(selector);
                    const count = await links.count();
                    assert('viewer-outline-link-count', count > 0, String(count));
                    await links.first().click();
                    await page.waitForTimeout(600);
                });

                await step('assert-outline-hash', async () => {
                    const hash = await page.evaluate(() => window.location.hash || '');
                    assert('viewer-outline-hash-present', /^#/.test(hash), hash);
                });
            }
        }
    ];
}

function buildFolderScenarios() {
    return [
        {
            id: 'folder-enter-subfolder',
            run: async ({ page, step, assert }) => {
                await step('click-subfolder-node', async () => {
                    await page.waitForSelector('#folder-map-svg g.map-clickable', { timeout: 15000 });
                    const nodes = page.locator('#folder-map-svg g.map-clickable');
                    const count = await nodes.count();
                    assert('folder-map-clickable-count', count > 1, String(count));
                    await nodes.nth(1).click();
                    await page.waitForTimeout(900);
                });

                await step('assert-folder-url-path-param', async () => {
                    const url = page.url();
                    assert('folder-url-has-path-param', /\?path=/.test(url), url);
                });
            }
        },
        {
            id: 'folder-go-parent',
            run: async ({ page, step, assert, baseUrl }) => {
                await step('open-folder-child-path', async () => {
                    await page.goto(`${baseUrl}/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8`, {
                        waitUntil: 'networkidle',
                        timeout: 60000
                    });
                    await page.waitForTimeout(900);
                });

                await step('click-go-parent', async () => {
                    await page.click('#go-parent-btn');
                    await page.waitForTimeout(700);
                });

                await step('assert-go-parent-result-url', async () => {
                    const url = page.url();
                    assert('folder-url-parent-success', !/path=Modder%E5%85%A5%E9%97%A8/.test(url), url);
                });
            }
        },
        {
            id: 'folder-open-doc-node',
            run: async ({ page, step, assert, baseUrl }) => {
                await step('open-folder-path-for-doc', async () => {
                    await page.goto(`${baseUrl}/site/pages/folder.html?path=Modder%E5%85%A5%E9%97%A8`, {
                        waitUntil: 'networkidle',
                        timeout: 60000
                    });
                    await page.waitForTimeout(1000);
                });

                await step('click-doc-node', async () => {
                    const clicked = await page.evaluate(() => {
                        const nodes = Array.from(document.querySelectorAll('#folder-map-svg g.map-clickable'));
                        const docNode = nodes.find((node) => {
                            const title = node.querySelector('title');
                            return title && /\.md$/i.test(String(title.textContent || '').trim());
                        });
                        if (!docNode) return false;
                        docNode.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        return true;
                    });
                    assert('folder-doc-node-found', clicked, 'no clickable doc node');
                    await page.waitForLoadState('domcontentloaded');
                    await page.waitForTimeout(800);
                });

                await step('assert-doc-navigation-url', async () => {
                    const url = page.url();
                    assert('folder-doc-to-viewer', /\/site\/pages\/viewer\.html\?file=/.test(url), url);
                });
            }
        }
    ];
}

function buildIdeScenarios() {
    return [
        {
            id: 'ide-file-create-and-input',
            run: async ({ page, step, assert }) => {
                await step('ensure-ide-ready-and-files', async () => {
                    await ensureIdeFiles(page, ['demo.md', 'effect.fx', 'swing.animcs']);
                });

                await step('input-markdown-content', async () => {
                    await page.click('#file-list .file-item:has-text("demo.md")');
                    await page.evaluate(() => {
                        globalThis.__tmlIdeDebug.setEditorText('# Demo\n\n这是自动化验收输入内容。');
                    });
                    const text = await page.evaluate(() => String(globalThis.__tmlIdeDebug.getEditorText() || ''));
                    assert('ide-markdown-input-applied', text.includes('自动化验收输入内容'), text);
                });
            }
        },
        {
            id: 'ide-repo-tree-scm-badges',
            run: async ({ page, step, assert }) => {
                let modifyPath = '';
                let deletePath = '';

                await step('prepare-tree-and-added-file', async () => {
                    await ensureIdeFiles(page, ['如何贡献/scm-badge-added.md']);
                    const picked = await page.evaluate(async () => {
                        let changed = true;
                        let guard = 0;
                        while (changed && guard < 40) {
                            guard += 1;
                            changed = false;
                            const toggles = Array.from(document.querySelectorAll('#file-list .repo-tree-toggle'));
                            toggles.forEach((button) => {
                                const arrow = String(button.querySelector('.repo-tree-chevron')?.textContent || '').trim();
                                if (arrow === '▸') {
                                    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                                    changed = true;
                                }
                            });
                        }
                        const repoPaths = Array.from(document.querySelectorAll('#file-list [data-node-type="file"]'))
                            .map((node) => String(node.dataset.repoPath || '').trim())
                            .filter(Boolean)
                            .filter((path, index, list) => list.indexOf(path) === index);
                        const textPaths = repoPaths.filter((path) => /\.(?:md|cs|animcs|fx)$/i.test(path));
                        const addedPath = '如何贡献/scm-badge-added.md';

                        function toContentPath(pathValue) {
                            return '/site/content/' + String(pathValue || '')
                                .split('/')
                                .filter(Boolean)
                                .map((segment) => encodeURIComponent(segment))
                                .join('/');
                        }

                        async function findBaselinePath(preferred, excluded) {
                            const tried = new Set();
                            const candidates = preferred.concat(textPaths);
                            for (const candidate of candidates) {
                                const pathValue = String(candidate || '').trim();
                                if (!pathValue || excluded.has(pathValue) || tried.has(pathValue)) continue;
                                tried.add(pathValue);
                                try {
                                    const response = await fetch(toContentPath(pathValue), { method: 'HEAD', cache: 'no-store' });
                                    if (response.ok) return pathValue;
                                } catch (_err) {
                                    // ignore network probe error
                                }
                            }
                            return '';
                        }

                        const modify = await findBaselinePath(
                            ['Modder入门/制作第一把武器.md', 'anims/animgeom-toolkit-recipes.cs', 'Modder入门/code/program.cs'],
                            new Set([addedPath])
                        );
                        const remove = await findBaselinePath(
                            ['Modder入门/第一个Mod弹幕.md', 'anims/demo-basic.cs', 'Modder入门/第一把远程武器.md'],
                            new Set([addedPath, modify])
                        );
                        return { modify, remove };
                    });
                    modifyPath = String(picked && picked.modify || '');
                    deletePath = String(picked && picked.remove || '');
                    assert('ide-tree-modify-path-found', firstTruthy(modifyPath), modifyPath);
                    assert('ide-tree-delete-path-found', firstTruthy(deletePath), deletePath);
                    await page.waitForTimeout(240);
                });

                await step('create-modified-status', async () => {
                    const clicked = await page.evaluate((targetPath) => {
                        const node = Array.from(document.querySelectorAll('#file-list [data-node-type="file"]'))
                            .find((item) => String(item.dataset.repoPath || '') === targetPath);
                        if (!node) return false;
                        node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        return true;
                    }, modifyPath);
                    assert('ide-tree-modify-path-clicked', clicked, modifyPath);
                    await page.waitForFunction((targetPath) => {
                        const active = document.querySelector('#active-file-name');
                        return !!(active && String(active.textContent || '').trim() === targetPath);
                    }, modifyPath, { timeout: 15000 });
                    await page.evaluate(() => {
                        globalThis.__tmlIdeDebug.setEditorText([
                            '# SCM Badge',
                            '',
                            'modified status marker',
                            '',
                            'A/M/D debug flow'
                        ].join('\n'));
                    });
                    await page.waitForFunction((targetPath) => {
                        return !!document.querySelector('#file-list .repo-tree-change-badge[data-status="M"]');
                    }, modifyPath, { timeout: 15000 });
                });

                await step('create-deleted-status', async () => {
                    const clicked = await page.evaluate((targetPath) => {
                        const node = Array.from(document.querySelectorAll('#file-list [data-node-type="file"]'))
                            .find((item) => String(item.dataset.repoPath || '') === targetPath);
                        if (!node) return false;
                        node.dispatchEvent(new MouseEvent('click', { bubbles: true }));
                        return true;
                    }, deletePath);
                    assert('ide-tree-delete-path-clicked', clicked, deletePath);
                    await page.waitForFunction((targetPath) => {
                        const active = document.querySelector('#active-file-name');
                        return !!(active && String(active.textContent || '').trim() === targetPath);
                    }, deletePath, { timeout: 15000 });
                    page.once('dialog', async (dialog) => {
                        if (dialog.type() === 'confirm') {
                            await dialog.accept();
                            return;
                        }
                        await dialog.dismiss();
                    });
                    await page.click('#btn-delete-file');
                    await page.waitForFunction((targetPath) => {
                        return !!document.querySelector('#file-list .repo-tree-change-badge[data-status="D"]');
                    }, deletePath, { timeout: 15000 });
                });

                await step('assert-tree-badge-statuses', async () => {
                    const summary = await page.evaluate(() => {
                        const badges = Array.from(document.querySelectorAll('#file-list .repo-tree-change-badge'));
                        const statuses = badges
                            .map((badge) => String(badge.dataset.status || badge.textContent || '').trim())
                            .filter(Boolean);
                        return {
                            statuses,
                            rightAligned: badges.every((badge) => badge.parentElement && badge.parentElement.lastElementChild === badge)
                        };
                    });
                    assert('ide-tree-badge-has-A', summary.statuses.includes('A'), JSON.stringify(summary.statuses));
                    assert('ide-tree-badge-has-M', summary.statuses.includes('M'), JSON.stringify(summary.statuses));
                    assert('ide-tree-badge-has-D', summary.statuses.includes('D'), JSON.stringify(summary.statuses));
                    assert('ide-tree-badge-right-side', summary.rightAligned, JSON.stringify(summary));
                });
            }
        },
        {
            id: 'ide-markdown-preview',
            run: async ({ page, step, assert }) => {
                await step('ensure-ide-ready-and-markdown-file', async () => {
                    await ensureIdeFiles(page, ['demo.md']);
                    await page.click('#file-list .file-item:has-text("demo.md")');
                    await page.evaluate(() => {
                        globalThis.__tmlIdeDebug.setEditorText('# Preview\n\nmarkdown 预览流程。');
                    });
                });

                await step('toggle-markdown-preview', async () => {
                    await page.click('#btn-markdown-toggle-preview');
                    await page.waitForSelector('#markdown-preview-pane:not([hidden])', { timeout: 10000 });
                });

                await step('assert-markdown-preview-frame', async () => {
                    const ok = await page.evaluate(() => {
                        const frame = document.querySelector('#markdown-preview-frame');
                        if (!(frame instanceof HTMLIFrameElement)) return false;
                        const src = String(frame.getAttribute('src') || '');
                        return src.includes('/site/pages/viewer.html?') && src.includes('studio_preview=1');
                    });
                    assert('ide-markdown-preview-src-valid', ok, 'viewer preview iframe not ready');
                });
            }
        },
        {
            id: 'ide-shader-preview',
            run: async ({ page, step, assert }) => {
                await step('prepare-shader-file', async () => {
                    await ensureIdeFiles(page, ['effect.fx']);
                    await page.click('#file-list .file-item:has-text("effect.fx")');
                    await page.click('#btn-shader-insert-template');
                    await page.waitForFunction(() => {
                        const text = String(globalThis.__tmlIdeDebug.getEditorText() || '');
                        return text.includes('float4 MainPS')
                            && text.includes('technique MainTechnique');
                    }, null, { timeout: 10000 });
                });

                await step('open-shader-preview-modal', async () => {
                    await page.click('#btn-shader-preview-popup');
                    await page.waitForSelector('#shader-preview-modal:not([hidden])', { timeout: 10000 });
                });

                await step('assert-shader-preview-canvas', async () => {
                    const ok = await page.evaluate(() => {
                        const canvas = document.querySelector('#shader-preview-canvas');
                        return Boolean(canvas && canvas.width >= 0 && canvas.height >= 0);
                    });
                    assert('ide-shader-preview-canvas-exists', ok, 'shader preview canvas not found');
                    await page.click('#btn-shader-preview-close');
                });
            }
        },
        {
            id: 'ide-anim-completion',
            run: async ({ page, step, assert }) => {
                await step('prepare-animcs-file', async () => {
                    await ensureIdeFiles(page, ['swing.animcs']);
                    await page.click('#file-list .file-item:has-text("swing.animcs")');
                    await page.evaluate(() => {
                        globalThis.__tmlIdeDebug.setEditorText([
                            'using AnimRuntime;',
                            'using AnimRuntime.Math;',
                            '',
                            'public class DemoAnim',
                            '{',
                            '    public void Test(ICanvas2D g, AnimContext ctx)',
                            '    {',
                            '        AnimGeom.',
                            '    }',
                            '}'
                        ].join('\n'));
                        globalThis.__tmlIdeDebug.setCursorAfterText('AnimGeom.');
                    });
                });

                await step('request-animation-completion', async () => {
                    const labels = await page.evaluate(async () => {
                        const items = await globalThis.__tmlIdeDebug.requestCompletionsAtCursor(200);
                        return Array.isArray(items) ? items.map((item) => String(item.label || '')) : [];
                    });
                    assert('ide-anim-completion-has-drawaxes', labels.includes('DrawAxes'), JSON.stringify(labels.slice(0, 20)));
                });
            }
        }
    ];
}

export function buildViewerPageDef() {
    return {
        pageId: 'viewer',
        urlPath: '/site/pages/viewer.html?file=Modder%E5%85%A5%E9%97%A8/%E5%88%B6%E4%BD%9C%E7%AC%AC%E4%B8%80%E6%8A%8A%E6%AD%A6%E5%99%A8.md',
        scenarios: buildViewerScenarios()
    };
}

export function buildFolderPageDef() {
    return {
        pageId: 'folder',
        urlPath: '/site/pages/folder.html',
        scenarios: buildFolderScenarios()
    };
}

export function buildIdePageDef(options) {
    const opts = options && typeof options === 'object' ? options : {};
    const allScenarios = buildIdeScenarios();
    const allowed = Array.isArray(opts.scenarioIds) && opts.scenarioIds.length > 0
        ? new Set(opts.scenarioIds.map((item) => String(item)))
        : null;
    const scenarios = allowed
        ? allScenarios.filter((item) => allowed.has(item.id))
        : allScenarios;
    return {
        pageId: String(opts.pageId || 'tml-ide'),
        urlPath: String(opts.urlPath || '/tml-ide/'),
        scenarios
    };
}

