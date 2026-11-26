import { EventEmitter } from 'node:events';
import { createServer } from 'node:http';
import os from 'node:os';

const GROUP = 'ББМО-01-23';

class EventBus extends EventEmitter {
    constructor() {
        super();

        this.listenersMap = new Map();
        this.anyListeners = [];
        this.sequence = 0;

        this.metrics = {
            events: {},
            total: 0,
            lastCall: {}
        };
    }

    on(event, listener, priority = 0) {
        if (!this.listenersMap.has(event)) {
            this.listenersMap.set(event, []);
        }

        const item = {
            listener,
            priority,
            sequence: this.sequence++,
            once: false
        };

        this.listenersMap.get(event).push(item);

        this.listenersMap.get(event).sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }

            return a.sequence - b.sequence;
        });

        return this;
    }

    once(event, listener, priority = 0) {
        if (!this.listenersMap.has(event)) {
            this.listenersMap.set(event, []);
        }

        const item = {
            listener,
            priority,
            sequence: this.sequence++,
            once: true
        };

        this.listenersMap.get(event).push(item);

        this.listenersMap.get(event).sort((a, b) => {
            if (b.priority !== a.priority) {
                return b.priority - a.priority;
            }

            return a.sequence - b.sequence;
        });

        return this;
    }

    off(event, listener) {
        const listeners = this.listenersMap.get(event);

        if (!listeners) {
            return this;
        }

        const filtered = listeners.filter(
            item => item.listener !== listener
        );

        if (filtered.length === 0) {
            this.listenersMap.delete(event);
        } else {
            this.listenersMap.set(event, filtered);
        }

        return this;
    }

    onAny(listener) {
        this.anyListeners.push(listener);
        return this;
    }

    emit(event, ...args) {
        // Метрики
        if (event !== 'error') {
            if (!this.metrics.events[event]) {
                this.metrics.events[event] = 0;
            }

            this.metrics.events[event]++;
            this.metrics.total++;

            this.metrics.lastCall[event] =
                new Date().toISOString();
        }

        // Wildcard listeners
        for (const listener of this.anyListeners) {
            try {
                listener(event, ...args);
            } catch (error) {
                if (event !== 'error') {
                    this.emit(
                        'error',
                        error,
                        event
                    );
                }
            }
        }

        const listeners = this.listenersMap.get(event);

        if (!listeners || listeners.length === 0) {
            return false;
        }

        // Создаём копию, чтобы once можно было удалять
        const currentListeners = [...listeners];

        for (const item of currentListeners) {
            try {
                item.listener(...args);
            } catch (error) {
                if (event !== 'error') {
                    this.emit(
                        'error',
                        error,
                        event
                    );
                }
            }

            if (item.once) {
                this.off(event, item.listener);
            }
        }

        return true;
    }

    listenerCount(event) {
        return this.listenersMap.get(event)?.length || 0;
    }

    getMetrics() {
        const listeners = {};

        for (const [event, items] of this.listenersMap) {
            listeners[event] = items.length;
        }

        return {
            group: GROUP,
            events: this.metrics.events,
            total: this.metrics.total,
            lastCall: this.metrics.lastCall,
            listeners
        };
    }
}

const bus = new EventBus();

console.log(`=== EventBus (группа ${GROUP}) ===`);


// ==========================================
// ПРИОРИТЕТЫ
// ==========================================

console.log('');
console.log('--- Приоритеты ---');

bus.on(
    'priority',
    () => {
        console.log('[priority 0] Низкий приоритет');
    },
    0
);

bus.on(
    'priority',
    () => {
        console.log('[priority 10] Высокий приоритет');
    },
    10
);

bus.on(
    'priority',
    () => {
        console.log('[priority 5] Средний приоритет');
    },
    5
);

bus.emit('priority');


// ==========================================
// WILDCARD
// ==========================================

console.log('');
console.log('--- Wildcard ---');

bus.onAny((event, ...args) => {
    console.log(
        `[onAny] Событие "${event}" с аргументами: ${JSON.stringify(args)}`
    );
});

bus.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

bus.on('info', (group) => {
    console.log(`[info] Группа: ${group}`);
});

bus.emit('greet', 'Дарья');
bus.emit('info', GROUP);


// ==========================================
// ONCE-КЭШ
// ==========================================

console.log('');
console.log('--- Once-кэш ---');

let onceCount = 0;

bus.on('tick', () => {
    console.log('[tick] Обычный слушатель');
});

bus.once('tick', () => {
    onceCount++;

    console.log(
        `[tick] once-слушатель, вызов №${onceCount}`
    );
});

bus.emit('tick');
bus.emit('tick');
bus.emit('tick');

console.log(
    `once-слушатель вызван: ${onceCount} раз`
);


// ==========================================
// ОБРАБОТКА ОШИБОК
// ==========================================

console.log('');
console.log('--- Обработка ошибок ---');

bus.on(
    'error',
    (error, eventName) => {
        console.log(
            `[ERROR] [${GROUP}] Ошибка в слушателе "${eventName}": ${error.message}`
        );
    },
    100
);

bus.on('test', () => {
    console.log('[test] Первый слушатель');
});

bus.on('test', () => {
    throw new Error('Ошибка первого обработчика');
});

bus.on('test', () => {
    console.log('[test] Второй слушатель');
});

bus.on('test2', () => {
    throw new Error('Ошибка второго обработчика');
});

bus.emit('test');
bus.emit('test2');


// ==========================================
// OFF
// ==========================================

console.log('');
console.log('--- Отписка off ---');

function temporaryListener() {
    console.log('[off] Временный слушатель');
}

bus.on('temporary', temporaryListener);

console.log(
    `До off: ${bus.listenerCount('temporary')}`
);

bus.off('temporary', temporaryListener);

console.log(
    `После off: ${bus.listenerCount('temporary')}`
);


// ==========================================
// МЕТРИКИ
// ==========================================

console.log('');
console.log('--- Метрики ---');

const metrics = bus.getMetrics();

for (const [event, count] of Object.entries(metrics.events)) {
    console.log(`${event}: ${count} вызова(ов)`);
}

console.log(`Всего событий: ${metrics.total}`);

console.log(
    `Последний вызов: ${metrics.lastCall.test2}`
);


// ==========================================
// ИНТЕГРАЦИЯ С OS
// ==========================================

console.log('');
console.log('--- Интеграция с os ---');

bus.on('system', (data) => {
    console.log(
        `[system] CPU: ${data.cpu}, RAM: ${data.ram}%`
    );
});

const totalMemory = os.totalmem();
const freeMemory = os.freemem();

const usedRam =
    ((totalMemory - freeMemory) / totalMemory) * 100;

bus.emit('system', {
    cpu: os.cpus().length,
    ram: usedRam.toFixed(2)
});


// ==========================================
// HTTP SERVER
// ==========================================

console.log('');
console.log('--- HTTP-сервер ---');

const server = createServer((req, res) => {
    bus.emit('request', req.method, req.url);

    if (req.url === '/metrics') {
        const data = bus.getMetrics();

        res.writeHead(200, {
            'Content-Type': 'application/json; charset=utf-8'
        });

        res.end(
            JSON.stringify(data, null, 2)
        );

        return;
    }

    res.writeHead(200, {
        'Content-Type': 'text/plain; charset=utf-8'
    });

    res.end(
        `EventBus работает. Группа: ${GROUP}`
    );
});

server.listen(3000, () => {
    console.log(
        'HTTP-сервер запущен: http://localhost:3000'
    );

    console.log(
        'Метрики: http://localhost:3000/metrics'
    );

    console.log('');
    console.log('=== EventBus готов ===');
});