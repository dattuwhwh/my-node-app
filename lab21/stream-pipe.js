import fs from 'fs';
import { Transform } from 'stream';
import { pipeline } from 'stream/promises';

const inputFile = 'input.txt';

fs.writeFileSync(
    inputFile,
    `Группа: ББМО-01-23
Студент: Поддубская Дарья Сергеевна
Лабораторная работа: №21
Тема: Потоки в Node.js
`
);

console.log('=== Демонстрация pipe() ===');

await new Promise((resolve) => {
    const source = fs.createReadStream(inputFile);
    const destination = fs.createWriteStream('output-pipe.txt');

    source.on('error', (error) => {
        console.log(`✖ Ошибка: ${error.message}`);
        resolve();
    });

    destination.on('finish', () => {
        console.log('✔ Копирование завершено');

        const size = fs.statSync('output-pipe.txt').size;
        console.log(`Размер: ${size} байт`);

        resolve();
    });

    source.pipe(destination);
});

console.log('\n=== Демонстрация pipe() с ошибкой ===');

await new Promise((resolve) => {
    const source = fs.createReadStream('missing.txt');
    const destination = fs.createWriteStream('output-error-pipe.txt');

    source.on('error', (error) => {
        console.log(`✖ Ошибка: ${error.message}`);
        console.log('⚠ Внимание: pipe() не закрыл целевой поток!');
        console.log('⚠ Возможна утечка памяти.');

        destination.destroy();
        resolve();
    });

    source.pipe(destination);
});

console.log('\n=== Демонстрация pipeline() ===');

try {
    await pipeline(
        fs.createReadStream(inputFile),
        fs.createWriteStream('output-pipeline.txt')
    );

    console.log('Чтение: input.txt');
    console.log('Запись: output-pipeline.txt');
    console.log('✔ Копирование завершено');
} catch (error) {
    console.log(`✖ Ошибка: ${error.message}`);
}

console.log('\n=== Демонстрация pipeline() с ошибкой ===');

try {
    await pipeline(
        fs.createReadStream('missing.txt'),
        fs.createWriteStream('output-error-pipeline.txt')
    );
} catch (error) {
    console.log('Чтение: missing.txt');
    console.log(`✖ Ошибка: ${error.message}`);
    console.log('✔ Все потоки автоматически закрыты');
    console.log('✔ Утечек нет');
}

console.log('\n=== Цепочка потоков ===');

const uppercase = new Transform({
    transform(chunk, encoding, callback) {
        callback(null, chunk.toString().toUpperCase());
    }
});

const reverse = new Transform({
    transform(chunk, encoding, callback) {
        const text = chunk.toString();
        callback(null, text.split('').reverse().join(''));
    }
});

await pipeline(
    fs.createReadStream(inputFile),
    uppercase,
    reverse,
    fs.createWriteStream('output-chain.txt')
);

console.log('input.txt → uppercase → reverse → output-chain.txt');
console.log('✔ Обработка завершена');

console.log('\n=== Проверка файлов ===');

console.log(
    'output-pipe.txt:',
    fs.readFileSync('output-pipe.txt', 'utf8')
);

console.log(
    'output-pipeline.txt:',
    fs.readFileSync('output-pipeline.txt', 'utf8')
);

console.log(
    'output-chain.txt:',
    fs.readFileSync('output-chain.txt', 'utf8')
);