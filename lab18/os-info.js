import os from 'node:os';
const GROUP = 'ББМО-01-23';

function formatUptime(seconds) {
    const totalSeconds = Math.floor(seconds);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    return `${hours} ч ${minutes} мин ${secs} сек`;
}

function getPlatformMessage(platform) {
    switch (platform) {
        case 'win32':
            return 'Вы работаете в Windows';

        case 'linux':
            return 'Вы работаете в Linux';

        case 'darwin':
            return 'Вы работаете в macOS';

        default:
            return 'Неизвестная платформа';
    }
}

console.log(`=== Информация о системе (группа ${GROUP}) ===`);
console.log(`Платформа: ${os.platform()}`);
console.log(`Тип ОС: ${os.type()}`);
console.log(`Архитектура: ${os.arch()}`);
console.log(`Версия ОС: ${os.release()}`);
console.log(`Имя хоста: ${os.hostname()}`);
console.log(`Время работы: ${formatUptime(os.uptime())}`);
console.log('');
console.log(getPlatformMessage(os.platform()));