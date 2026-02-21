export function createShellEventBus() {
    const handlersByTopic = new Map();

    function ensureTopic(topic) {
        const safeTopic = String(topic || '').trim();
        if (!safeTopic) {
            throw new TypeError('event topic is required');
        }
        if (!handlersByTopic.has(safeTopic)) {
            handlersByTopic.set(safeTopic, new Set());
        }
        return safeTopic;
    }

    return {
        on(topic, handler) {
            const safeTopic = ensureTopic(topic);
            if (typeof handler !== 'function') {
                throw new TypeError('event handler must be a function');
            }
            const set = handlersByTopic.get(safeTopic);
            set.add(handler);
            return () => {
                set.delete(handler);
            };
        },
        emit(topic, payload) {
            const safeTopic = ensureTopic(topic);
            const set = handlersByTopic.get(safeTopic);
            if (!set || set.size === 0) return;
            set.forEach((handler) => {
                try {
                    handler(payload);
                } catch (_err) {
                    // Isolated failure: keep notifying other listeners.
                }
            });
        },
        clear(topic) {
            if (typeof topic === 'undefined') {
                handlersByTopic.clear();
                return;
            }
            const safeTopic = String(topic || '').trim();
            if (!safeTopic) return;
            handlersByTopic.delete(safeTopic);
        }
    };
}

