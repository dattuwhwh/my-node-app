import os from 'node:os';

const GROUP = 'ББМО-01-23';

function gb(bytes) {
    return (bytes / 1024 / 1024 / 1024).toFixed(2);
}

function getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();
    const used = total - free;

    const freePercent = (free / total) * 100;
    const usedPercent = (used / total) * 100;

    return {
        total,
        free,
        used,
        freePercent,
        usedPercent
    };
}

function getCpuInfo() {
    const cpus = os.cpus();

    const frequencies = cpus.map(cpu => cpu.speed);

    const averageFrequency =
        frequencies.reduce((sum, value) => sum + value, 0) /
        frequencies.length;

    return {
        count: cpus.length,
        model: cpus[0]?.model || 'Неизвестно',
        frequencies,
        averageFrequency
    };
}

function showLoadAverage() {
    console.log('=== Средняя загрузка системы ===');

    if (os.platform() === 'win32') {
        console.log('Загрузка 1/5/15 мин: недоступна для Windows');
        return;
    }

    const load = os.loadavg();

    console.log(`За 1 мин: ${load[0].toFixed(2)}`);
    console.log(`За 5 мин: ${load[1].toFixed(2)}`);
    console.log(`За 15 мин: ${load[2].toFixed(2)}`);
}

const cpu = getCpuInfo();
const memory = getMemoryInfo();

console.log('=== Информация о процессоре ===');
console.log(`Количество логических ядер: ${cpu.count}`);
console.log(`Модель процессора: ${cpu.model}`);
console.log('');

console.log('Частота каждого ядра:');

cpu.frequencies.forEach((frequency, index) => {
    console.log(`Ядро ${index + 1}: ${frequency} МГц`);
});

console.log(
    `Средняя частота: ${cpu.averageFrequency.toFixed(0)} МГц`
);

console.log('');

console.log('=== Информация о памяти ===');
console.log(`Общий объём: ${gb(memory.total)} ГБ`);
console.log(`Свободно: ${gb(memory.free)} ГБ`);
console.log(
    `Использовано: ${gb(memory.used)} ГБ (${memory.usedPercent.toFixed(1)}%)`
);
console.log(
    `Свободная память: ${memory.freePercent.toFixed(1)}%`
);

console.log('');
console.log(`Группа: ${GROUP}`);

if (memory.freePercent < 20) {
    console.log('⚠ Предупреждение: свободной памяти меньше 20%');
} else {
    console.log('Память в норме');
}

console.log('');

showLoadAverage();