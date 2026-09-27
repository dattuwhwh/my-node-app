import { EventEmitter } from 'node:events';

const GROUP = 'ББМО-01-23';

const emitter = new EventEmitter();

emitter.on('greet', (name) => {
    console.log(`[greet] Привет, ${name}!`);
});

emitter.on('info', () => {
    console.log(`[info] Группа: ${GROUP}`);
});

emitter.on('bye', () => {
    console.log('[bye] До свидания!');
});

console.log('=== Демонстрация EventEmitter ===');

emitter.emit('greet', 'Дарья');
emitter.emit('info');
emitter.emit('bye');

const unknownResult = emitter.emit('unknown');

const greetResult = emitter.emit('greet', 'Дарья');

console.log(
    `Событие "unknown" без слушателей: ${unknownResult}`
);

console.log(
    `Событие "greet" со слушателями: ${greetResult}`
);