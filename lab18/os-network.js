import os from 'node:os';

const GROUP = 'ББМО-01-23';

function maskMac(mac) {
    if (!mac || mac === '00:00:00:00:00:00') {
        return 'неизвестно';
    }

    const parts = mac.split(':');

    if (parts.length !== 6) {
        return mac;
    }

    return `${parts[0]}:${parts[1]}:${parts[2]}:**:**:**`;
}

function getNetworkInfo() {
    const interfaces = os.networkInterfaces();

    let interfaceCount = 0;
    let primaryInterface = null;

    console.log('=== Сетевые интерфейсы ===');

    for (const [name, addresses] of Object.entries(interfaces)) {
        interfaceCount++;

        console.log('');
        console.log(`Интерфейс: ${name}`);

        for (const address of addresses) {
            console.log(`IP: ${address.address}`);
            console.log(`Тип: ${address.family}`);
            console.log(`MAC: ${maskMac(address.mac)}`);
            console.log(`Внутренний: ${address.internal ? 'да' : 'нет'}`);

            if (
                !primaryInterface &&
                address.family === 'IPv4' &&
                !address.internal
            ) {
                primaryInterface = {
                    name,
                    address: address.address
                };
            }
        }
    }

    console.log('');
    console.log(`Всего интерфейсов: ${interfaceCount}`);

    if (primaryInterface) {
        console.log(
            `Основной интерфейс: ${primaryInterface.name} (${primaryInterface.address})`
        );
    } else {
        console.log('Основной интерфейс: не найден');
    }
}

function getUserInfo() {
    const user = os.userInfo();

    console.log('');
    console.log('=== Информация о пользователе ===');

    console.log(`Имя пользователя: ${user.username}`);

    if (process.platform === 'win32') {
        console.log('UID: недоступен в Windows');
        console.log('GID: недоступен в Windows');
    } else {
        console.log(`UID: ${user.uid}`);
        console.log(`GID: ${user.gid}`);
    }

    console.log(`Домашняя директория: ${user.homedir}`);
    console.log(`Оболочка по умолчанию: ${user.shell || 'недоступна'}`);

    console.log(`Группа: ${GROUP}`);

    if (process.platform === 'win32') {
        console.log('Проверка root: не применимо для Windows');
    } else {
        console.log(
            `Проверка root: ${user.uid === 0 ? 'ВНИМАНИЕ, пользователь root' : 'нет'}`
        );
    }
}

getNetworkInfo();
getUserInfo();