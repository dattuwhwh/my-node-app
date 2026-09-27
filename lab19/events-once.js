import { EventEmitter } from 'node:events';

const GROUP = 'ББМО-01-23';

const emitter = new EventEmitter();

let onCount = 0;
let onceCount = 0;

function onTick() {
    onCount++;
    console.log(`[tick #${onCount}] on-слушатель`);
}

function onceTick() {
    onceCount++;
    console.log(`[tick #${onCount + onceCount - 1}] once-слушатель`);
}

function groupListener() {
    console.log(`[tick] Слушатель группы ${GROUP}`);
}

function secondListener() {
    console.log('[tick] Второй слушатель');
}

function thirdListener() {
    console.log('[tick] Третий слушатель');
}

console.log('=== Сравнение on и once ===');

emitter.on('tick', onTick);
emitter.once('tick', onceTick);

emitter.emit('tick');
emitter.emit('tick');
emitter.emit('tick');

console.log('');
console.log(`on-слушатель вызван: ${onCount} раза`);
console.log(`once-слушатель вызван: ${onceCount} раз`);

console.log('');
console.log('=== Управление подписками ===');

emitter.on('tick', groupListener);
emitter.on('tick', secondListener);
emitter.on('tick', thirdListener);

console.log(
    `Слушателей до удаления: ${emitter.listenerCount('tick')}`
);

const listeners = emitter.listeners('tick');

if (listeners.length > 0) {
    emitter.removeListener('tick', listeners[listeners.length - 1]);
}

console.log(
    `Слушателей после удаления одного: ${emitter.listenerCount('tick')}`
);

emitter.removeAllListeners('tick');

console.log(
    `Слушателей после removeAllListeners: ${emitter.listenerCount('tick')}`
);

console.log('');
console.log('=== Порядок вызова ===');

emitter.on('order', () => {
    console.log(`1. Первый слушатель (группа ${GROUP})`);
});

emitter.on('order', () => {
    console.log('2. Второй слушатель');
});

emitter.on('order', () => {
    console.log('3. Третий слушатель');
});

emitter.emit('order');