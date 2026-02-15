const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createLocalStorage(initialValues) {
    const store = new Map(Object.entries(initialValues || {}));
    return {
        getItem(key) {
            return store.has(key) ? store.get(key) : null;
        },
        setItem(key, value) {
            store.set(String(key), String(value));
        },
        removeItem(key) {
            store.delete(String(key));
        }
    };
}

function createDocument() {
    const idMap = new Map();
    const domListeners = {};

    function createElement(tagName) {
        const element = {
            tagName: String(tagName || '').toUpperCase(),
            attributes: {},
            children: [],
            parentNode: null,
            className: '',
            textContent: '',
            _value: '',
            _listeners: {},
            appendChild(child) {
                child.parentNode = element;
                element.children.push(child);
                return child;
            },
            insertBefore(newNode, referenceNode) {
                const index = element.children.indexOf(referenceNode);
                if (index === -1) {
                    return element.appendChild(newNode);
                }
                newNode.parentNode = element;
                element.children.splice(index, 0, newNode);
                return newNode;
            },
            removeChild(child) {
                const index = element.children.indexOf(child);
                if (index >= 0) {
                    element.children.splice(index, 1);
                    child.parentNode = null;
                }
                return child;
            },
            setAttribute(name, value) {
                const attrName = String(name);
                const attrValue = String(value);
                element.attributes[attrName] = attrValue;
                if (attrName === 'id') {
                    idMap.set(attrValue, element);
                }
                if (attrName === 'class') {
                    element.className = attrValue;
                }
            },
            getAttribute(name) {
                const attrName = String(name);
                if (Object.prototype.hasOwnProperty.call(element.attributes, attrName)) {
                    return element.attributes[attrName];
                }
                return null;
            },
            addEventListener(type, handler) {
                if (!element._listeners[type]) element._listeners[type] = [];
                element._listeners[type].push(handler);
            },
            dispatchEvent(event) {
                const handlers = element._listeners[event.type] || [];
                for (const handler of handlers) {
                    handler.call(element, event);
                }
                return true;
            }
        };

        Object.defineProperty(element, 'id', {
            get() {
                return element.getAttribute('id') || '';
            },
            set(value) {
                element.setAttribute('id', value);
            }
        });

        Object.defineProperty(element, 'value', {
            get() {
                if (element.tagName === 'SELECT') {
                    if (element._value) return element._value;
                    const options = element.children.filter((child) => child.tagName === 'OPTION');
                    return options.length ? (options[0].value || '') : '';
                }
                return element._value;
            },
            set(value) {
                element._value = String(value);
            }
        });

        Object.defineProperty(element, 'options', {
            get() {
                return element.children.filter((child) => child.tagName === 'OPTION');
            }
        });

        return element;
    }

    const document = {
        readyState: 'complete',
        documentElement: createElement('html'),
        body: createElement('body'),
        createElement,
        getElementById(id) {
            return idMap.get(String(id)) || null;
        },
        addEventListener(type, handler) {
            if (!domListeners[type]) domListeners[type] = [];
            domListeners[type].push(handler);
        },
        dispatchEvent(event) {
            const handlers = domListeners[event.type] || [];
            for (const handler of handlers) {
                handler.call(document, event);
            }
            return true;
        }
    };

    document.documentElement.appendChild(document.body);
    return document;
}

function runScript(relativePath, contextValues) {
    const scriptPath = path.resolve(relativePath);
    const code = fs.readFileSync(scriptPath, 'utf8');
    const context = vm.createContext(contextValues);
    vm.runInContext(code, context, { filename: scriptPath });
}

function setupAccentSelect(document) {
    const navList = document.createElement('ul');
    const accentItem = document.createElement('li');
    const accentSelect = document.createElement('select');
    accentSelect.id = 'accent-select';

    const optionValues = ['green', 'blue', 'purple', 'orange', 'red', 'cyan', 'vs', 'git', 'black', 'white'];
    for (const value of optionValues) {
        const option = document.createElement('option');
        option.value = value;
        option.textContent = value;
        accentSelect.appendChild(option);
    }

    accentItem.appendChild(accentSelect);
    navList.appendChild(accentItem);
    document.body.appendChild(navList);

    return {
        navList,
        accentItem,
        accentSelect
    };
}

function optionValues(select) {
    return select.options.map((option) => option.value);
}

test('theme-init keeps light mode and normalizes accent by mode', () => {
    const document = createDocument();
    const localStorage = createLocalStorage({
        'theme-mode': 'light',
        accent: 'vs'
    });

    runScript('site/assets/js/theme-init.js', {
        document,
        localStorage
    });

    assert.equal(document.documentElement.getAttribute('data-theme-mode'), 'light');
    assert.equal(document.documentElement.getAttribute('data-theme'), 'light');
    assert.equal(document.documentElement.getAttribute('data-accent'), 'green');
});

test('theme-init infers special mode from existing special accent', () => {
    const document = createDocument();
    const localStorage = createLocalStorage({
        accent: 'git'
    });

    runScript('site/assets/js/theme-init.js', {
        document,
        localStorage
    });

    assert.equal(document.documentElement.getAttribute('data-theme-mode'), 'special');
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(document.documentElement.getAttribute('data-accent'), 'git');
});

test('accent-theme injects mode select and syncs accent options by mode', () => {
    const document = createDocument();
    const localStorage = createLocalStorage({
        'theme-mode': 'dark',
        accent: 'green'
    });

    document.documentElement.setAttribute('data-theme', 'dark');
    document.documentElement.setAttribute('data-theme-mode', 'dark');
    document.documentElement.setAttribute('data-accent', 'green');

    const setup = setupAccentSelect(document);

    runScript('site/assets/js/accent-theme.js', {
        document,
        localStorage
    });

    const modeSelect = document.getElementById('theme-mode-select');
    assert.ok(modeSelect, 'theme mode select should exist');
    assert.equal(modeSelect.value, 'dark');
    assert.deepEqual(
        optionValues(setup.accentSelect),
        ['green', 'blue', 'purple', 'orange', 'red', 'cyan']
    );

    modeSelect.value = 'special';
    modeSelect.dispatchEvent({ type: 'change' });

    assert.equal(document.documentElement.getAttribute('data-theme-mode'), 'special');
    assert.equal(document.documentElement.getAttribute('data-theme'), 'dark');
    assert.equal(document.documentElement.getAttribute('data-accent'), 'vs');
    assert.deepEqual(
        optionValues(setup.accentSelect),
        ['vs', 'git', 'black', 'white']
    );

    setup.accentSelect.value = 'git';
    setup.accentSelect.dispatchEvent({ type: 'change' });

    assert.equal(document.documentElement.getAttribute('data-accent'), 'git');
});
