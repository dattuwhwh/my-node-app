import os from 'node:os';
import fs from 'node:fs';

const GROUP = 'ББМО-01-23';
const LOG_FILE = 'monitor.log';

let previousCpu = null;
let warningCount = 0;
let monitorTimer = null;

function getCpuSnapshot() {
    const cpus = os.cpus();

    let idle = 0;
    let total = 0;

    for (const cpu of cpus) {
        idle += cpu.times.idle;

        total +=
            cpu.times.user +
            cpu.times.nice +
            cpu.times.sys +
            cpu.times.idle +
            cpu.times.irq;
    }

    return { idle, total };
}

function calculateCpuUsage(previous, current) {
    if (!previous) {
        return 0;
    }

    const idleDiff = current.idle - previous.idle;
    const totalDiff = current.total - previous.total;

    if (totalDiff <= 0) {
        return 0;
    }

    const busyDiff = totalDiff - idleDiff;

    return (busyDiff / totalDiff) * 100;
}

function getMemoryInfo() {
    const total = os.totalmem();
    const free = os.freemem();

    const freePercent = (free / total) * 100;
    const usedPercent = 100 - freePercent;

    return {
        total,
        free,
        freePercent,
        usedPercent
    };
}

function getSystemSnapshot(cpuUsage) {
    const memory = getMemoryInfo();
    const user = os.userInfo();

    return {
        timestamp: new Date(),
        group: GROUP,
        platform: os.platform(),
        type: os.type(),
        architecture: os.arch(),
        release: os.release(),
        hostname: os.hostname(),
        uptime: os.uptime(),
        cpu: {
            cores: os.cpus().length,
            model: os.cpus()[0]?.model || 'Неизвестно',
            usage: cpuUsage
        },
        memory,
        user: user.username
    };
}

function writeWarning(message) {
    const now = new Date();

    const timestamp = now
        .toISOString()
        .replace('T', ' ')
        .substring(0, 19);

    const line =
        `[${timestamp}] [${GROUP}] Предупреждение: ${message}\n`;

    fs.appendFileSync(LOG_FILE, line);

    warningCount++;
}

function checkSystem(snapshot) {
    let symbols = '';

    if (snapshot.cpu.usage > 80) {
        symbols += ' ⚠⚠';

        writeWarning(
            `Загрузка CPU ${snapshot.cpu.usage.toFixed(1)}% — критично`
        );
    } else if (snapshot.cpu.usage > 50) {
        symbols += ' ⚠';

        writeWarning(
            `Загрузка CPU ${snapshot.cpu.usage.toFixed(1)}% — предупреждение`
        );
    }

    if (snapshot.memory.freePercent < 10) {
        symbols += ' ⚠';

        writeWarning(
            `Свободной памяти только ${snapshot.memory.freePercent.toFixed(1)}%`
        );
    }

    return symbols;
}

function monitor() {
    const currentCpu = getCpuSnapshot();

    const cpuUsage = calculateCpuUsage(
        previousCpu,
        currentCpu
    );

    previousCpu = currentCpu;

    const snapshot = getSystemSnapshot(cpuUsage);

    const symbols = checkSystem(snapshot);

    const freeMemoryGb =
        snapshot.memory.free / 1024 / 1024 / 1024;

    process.stdout.write(
        `\rCPU: ${cpuUsage.toFixed(1)}% | ` +
        `RAM: ${snapshot.memory.usedPercent.toFixed(1)}% ` +
        `(${freeMemoryGb.toFixed(2)} ГБ свободно)` +
        `${symbols}       `
    );
}

function showInitialSnapshot() {
    const snapshot = getSystemSnapshot(0);

    console.log('');
    console.log('=== Первичный сбор данных ===');
    console.log(`Группа: ${snapshot.group}`);
    console.log(`Платформа: ${snapshot.platform}`);
    console.log(`Тип ОС: ${snapshot.type}`);
    console.log(`Архитектура: ${snapshot.architecture}`);
    console.log(`Версия ОС: ${snapshot.release}`);
    console.log(`Имя хоста: ${snapshot.hostname}`);
    console.log(`Модель CPU: ${snapshot.cpu.model}`);
    console.log(`Количество ядер: ${snapshot.cpu.cores}`);
    console.log(`Пользователь: ${snapshot.user}`);

    console.log(
        `Объём RAM: ${(snapshot.memory.total / 1024 / 1024 / 1024).toFixed(2)} ГБ`
    );

    console.log(
        `Свободно RAM: ${(snapshot.memory.free / 1024 / 1024 / 1024).toFixed(2)} ГБ`
    );

    console.log('');
}

function startMonitor() {
    console.log(
        `Мониторинг (группа ${GROUP}). Ctrl+C для выхода.`
    );

    showInitialSnapshot();

    console.log('=== Расчёт загрузки CPU ===');
    console.log('Первый замер выполнен.');
    console.log('Следующий замер через 2 секунды.');
    console.log('');

    previousCpu = getCpuSnapshot();

    monitorTimer = setTimeout(() => {
        monitor();

        monitorTimer = setInterval(
            monitor,
            2000
        );
    }, 2000);
}

function stopMonitor() {
    if (monitorTimer) {
        clearTimeout(monitorTimer);
        clearInterval(monitorTimer);
    }

    console.log('');
    console.log('');
    console.log(
        `Мониторинг остановлен. Предупреждений: ${warningCount}`
    );

    process.exit(0);
}

process.on('SIGINT', stopMonitor);

process.on('uncaughtException', error => {
    console.error('');
    console.error(`Ошибка: ${error.message}`);

    if (monitorTimer) {
        clearTimeout(monitorTimer);
        clearInterval(monitorTimer);
    }

    process.exit(1);
});

startMonitor();