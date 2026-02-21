const loadedStyles = new Set();
const loadedScripts = new Set();

function toAbsoluteUrl(url) {
    return new URL(String(url || ''), globalThis.location.origin).toString();
}

function isStylesheetLink(node) {
    return node && node.tagName === 'LINK' && String(node.getAttribute('rel') || '').toLowerCase() === 'stylesheet';
}

function createRuntimeRoot(workspace) {
    const root = document.createElement('div');
    root.className = `workspace-runtime workspace-runtime-${workspace}`;
    root.dataset.workspaceRuntime = workspace;
    root.hidden = false;
    return root;
}

function cloneBodyContent(sourceDocument, stripSelectors) {
    const clone = sourceDocument.body.cloneNode(true);
    const selectors = Array.isArray(stripSelectors) ? stripSelectors : [];
    selectors.forEach((selector) => {
        clone.querySelectorAll(selector).forEach((node) => {
            node.remove();
        });
    });
    return clone;
}

function collectStyles(sourceDocument, workspace) {
    const links = [];
    sourceDocument.querySelectorAll('link').forEach((node) => {
        if (!isStylesheetLink(node)) return;
        const href = String(node.getAttribute('href') || '').trim();
        if (!href) return;
        const abs = toAbsoluteUrl(href);
        if (loadedStyles.has(abs)) return;
        loadedStyles.add(abs);
        links.push({ href, workspace });
    });
    return links;
}

function collectScripts(sourceDocument, ignoreScriptPattern) {
    const scripts = [];
    sourceDocument.querySelectorAll('script').forEach((node) => {
        const src = String(node.getAttribute('src') || '').trim();
        if (src) {
            if (ignoreScriptPattern && ignoreScriptPattern.test(src)) return;
            scripts.push({ src, inline: '' });
            return;
        }
        const inline = String(node.textContent || '').trim();
        if (!inline) return;
        scripts.push({ src: '', inline });
    });
    return scripts;
}

async function injectStyles(styles) {
    styles.forEach((item) => {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = item.href;
        link.dataset.workspaceRuntimeStyle = item.workspace;
        document.head.appendChild(link);
    });
}

function loadScriptTag(scriptNode) {
    return new Promise((resolve, reject) => {
        scriptNode.onload = () => resolve();
        scriptNode.onerror = () => reject(new Error(`加载脚本失败: ${scriptNode.src || '<inline>'}`));
        document.body.appendChild(scriptNode);
    });
}

async function injectScripts(scripts, workspace) {
    for (const item of scripts) {
        if (item.src) {
            const abs = toAbsoluteUrl(item.src);
            if (loadedScripts.has(abs)) continue;
            loadedScripts.add(abs);

            const script = document.createElement('script');
            script.src = item.src;
            script.async = false;
            script.dataset.workspaceRuntimeScript = workspace;
            await loadScriptTag(script);
            continue;
        }

        const inlineKey = `inline:${workspace}:${item.inline}`;
        if (loadedScripts.has(inlineKey)) continue;
        loadedScripts.add(inlineKey);
        const script = document.createElement('script');
        script.textContent = item.inline;
        script.dataset.workspaceRuntimeScript = workspace;
        document.body.appendChild(script);
    }
}

export async function mountWorkspaceTemplate(options) {
    const opts = options || {};
    const workspace = String(opts.workspace || '').trim();
    if (!workspace) {
        throw new Error('workspace is required');
    }

    const host = opts.host;
    if (!host) {
        throw new Error('workspace host is required');
    }

    const templatePath = String(opts.templatePath || '').trim();
    if (!templatePath) {
        throw new Error('templatePath is required');
    }

    const response = await fetch(templatePath, { cache: 'no-store' });
    if (!response.ok) {
        throw new Error(`加载模板失败（${response.status}）：${templatePath}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const styles = collectStyles(doc, workspace);
    const scripts = collectScripts(doc, opts.ignoreScriptPattern || null);
    const bodyClone = cloneBodyContent(doc, opts.stripSelectors || []);

    await injectStyles(styles);
    const root = createRuntimeRoot(workspace);
    while (bodyClone.firstChild) {
        root.appendChild(bodyClone.firstChild);
    }
    host.appendChild(root);
    await injectScripts(scripts, workspace);
    return root;
}

