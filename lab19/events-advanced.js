import { EventEmitter } from 'node:events';

const GROUP = 'ББМО-01-23';

const emitter = new EventEmitter();

console.log(`=== Расширенные события EventEmitter ===`);
console.log(`Группа: ${GROUP}`);
console.log('');

console.log('=== newListener ===');

emitter.on('newListener', (eventName) => {
    if (eventName !== 'newListener') {
        console.log(`[newListener] Добавлен слушатель: ${eventName}`);
    }
});

function firstHandler() {
    console.log('[handler] Первый обработчик');
}

function secondHandler() {
    console.log('[handler] Второй обработчик');
}

emitter.on('test', firstHandler);
emitter.on('test', secondHandler);

console.log(
    `Количество слушателей test: ${emitter.listenerCount('test')}`
);

console.log('');

console.log('=== removeListener ===');

emitter.on('removeListener', (eventName) => {
    console.log(`[removeListener] Удалён слушатель: ${eventName}`);
});

emitter.removeListener('test', secondHandler);

console.log(
    `После удаления: ${emitter.listenerCount('test')}`
);

console.log('');

console.log('=== Система плагинов ===');

class PluginSystem extends EventEmitter {
    register(name, handler) {
        this.on(`plugin:${name}`, handler);

        console.log(
            `[PLUGIN] Зарегистрирован плагин: ${name}`
        );
    }

    run(name, data) {
        console.log(
            `[PLUGIN] Запуск плагина: ${name}`
        );

        this.emit(`plugin:${name}`, data);
    }
}

const plugins = new PluginSystem();

plugins.register('logger', (data) => {
    console.log(`[logger] ${data}`);
});

plugins.register('validator', (data) => {
    console.log(`[validator] Проверка: ${data}`);
});

plugins.register('report', (data) => {
    console.log(`[report] Создание отчёта: ${data}`);
});

plugins.run('logger', 'Событие получено');

plugins.run('validator', 'Данные корректны');

plugins.run('report', 'Отчёт за лабораторную работу №19');

console.log('');

console.log('=== Проверка утечки слушателей ===');

const leakEmitter = new EventEmitter();

leakEmitter.setMaxListeners(5);

for (let i = 1; i <= 7; i++) {
    leakEmitter.on('leak-test', () => {
        console.log(`Обработчик №${i}`);
    });
}

console.log(
    `Количество слушателей leak-test: ${leakEmitter.listenerCount('leak-test')}`
);

console.log(
    `Максимальное количество слушателей: ${leakEmitter.getMaxListeners()}`
);

if (
    leakEmitter.listenerCount('leak-test') >
    leakEmitter.getMaxListeners()
) {
    console.log(
        '⚠ ВНИМАНИЕ: превышен лимит слушателей. Возможна утечка.'
    );
}

console.log('');

console.log('=== Асинхронные события ===');

const asyncEmitter = new EventEmitter();

asyncEmitter.on('data', async (value) => {
    await new Promise(resolve => setTimeout(resolve, 500));

    console.log(`[async] Получены данные: ${value}`);
});

asyncEmitter.on('data', async (value) => {
    await new Promise(resolve => setTimeout(resolve, 200));

    console.log(`[async] Дополнительная обработка: ${value}`);
});

console.log('[async] Отправка события data');

asyncEmitter.emit('data', 'Тестовые данные');

setTimeout(() => {
    console.log('[async] Асинхронная обработка завершена');
}, 700);

setTimeout(() => {
    console.log('');
    console.log('=== Задание 4 завершено ===');
}, 800);