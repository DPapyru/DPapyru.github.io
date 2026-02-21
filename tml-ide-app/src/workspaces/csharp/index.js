export function createCsharpWorkspacePlugin(options) {
    const opts = options || {};
    const id = 'csharp';

    return {
        id,
        async mount(ctx) {
            const dom = ctx && ctx.dom ? ctx.dom : {};
            if (dom.workspaceCsharpRoot) {
                dom.workspaceCsharpRoot.hidden = false;
            }
            if (dom.workspaceSubappRoot) {
                dom.workspaceSubappRoot.hidden = true;
            }
            if (typeof opts.onMount === 'function') {
                opts.onMount(ctx);
            }
        },
        unmount(ctx) {
            const dom = ctx && ctx.dom ? ctx.dom : {};
            if (dom.workspaceCsharpRoot) {
                dom.workspaceCsharpRoot.hidden = true;
            }
        },
        getSnapshot() {
            return null;
        },
        restoreSnapshot(_snapshot) {
            // C# snapshot remains managed by workspace-store.v1/v2/v3 pipeline.
        },
        collectStaged() {
            return null;
        },
        getCommands() {
            return [];
        },
        handleCommand(_commandId) {
            return false;
        },
        getStatusItems() {
            return [];
        }
    };
}

