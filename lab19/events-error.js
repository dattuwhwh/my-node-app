import { EventEmitter } from 'node:events';

const emitter = new EventEmitter();

console.log('=== Демонстрация ошибки без слушателя ===');
console.log('Событие error будет вызвано без обработчика.');

emitter.emit(
    'error',
    new Error('Connection timeout')
);