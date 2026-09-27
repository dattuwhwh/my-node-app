import { Writable } from 'stream';

console.log('=== Демонстрация Writable-потока ===');

let writtenChunks = 0;

const writable = new Writable({
    highWaterMark: 16,

    write(chunk, encoding, callback) {
        writtenChunks++;

        console.log(`[WRITE] ${chunk.toString()}`);

        setTimeout(() => {
            callback();
        }, 100);
    }
});

writable.on('drain', () => {
    console.log('[DRAIN] Буфер освобождён, продолжаем запись');

    writeNext();
});

writable.on('finish', () => {
    console.log('[FINISH] Все данные записаны');
    console.log(`Всего записано: ${writtenChunks} чанка`);
});

writable.on('error', (error) => {
    console.error('[ERROR]', error.message);
});

const data = [
    'Группа: ББМО-01-23',
    'Студент: Поддубская Дарья Сергеевна',
    'Лабораторная работа: №21',
    'Тема: Потоки в Node.js'
];

let index = 0;

function writeNext() {
    while (index < data.length) {
        const chunk = data[index++];

        const canContinue = writable.write(chunk);

        console.log(`write() вернул: ${canContinue}`);

        if (!canContinue) {
            console.log('← буфер переполнен, ждём drain');
            return;
        }
    }

    writable.end();
}
 
writeNext();