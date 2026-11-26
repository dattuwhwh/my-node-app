import { EventEmitter } from 'node:events';

const GROUP = 'ББМО-01-23';

class DatabaseConnection extends EventEmitter {
    constructor() {
        super();
        this.connected = false;
    }

    connect() {
        console.log('[EVENT] Подключение к БД...');

        this.connected = true;

        this.emit('connect', {
            group: GROUP,
            status: 'connected'
        });
    }

    query(sql) {
        if (!this.connected) {
            this.error('Database is not connected');
            return;
        }

        this.emit('query', sql);

        let result;

        if (sql.toUpperCase().includes('SELECT')) {
            result = '50 записей';
        } else if (sql.toUpperCase().includes('INSERT')) {
            result = '1 запись добавлена';
        } else {
            result = 'Запрос выполнен';
        }

        this.emit('result', result);
    }

    close() {
        this.emit('close');

        this.connected = false;

        console.log('[EVENT] Соединение закрыто');
    }

    error(message) {
        this.emit('error', new Error(message));
    }
}

const db = new DatabaseConnection();

console.log(`=== DatabaseConnection (группа ${GROUP}) ===`);

db.on('connect', (data) => {
    console.log('[EVENT] Соединение установлено');
    console.log(`[EVENT] Группа: ${data.group}`);
});

db.on('query', (sql) => {
    console.log(`[EVENT] Выполнение запроса: ${sql}`);
});

db.on('result', (result) => {
    console.log(`[EVENT] Результат: ${result}`);
});

db.on('close', () => {
    console.log('[EVENT] Закрытие соединения');
});

db.on('error', (error) => {
    console.log(`[EVENT] Ошибка: ${error.message}`);
});

db.connect();

db.query('SELECT * FROM students');

db.query('INSERT INTO students');

db.close();

console.log('');
console.log('=== Демонстрация ошибки ===');

db.error('Connection timeout');

console.log(
    '(слушатель error обработал ошибку, поэтому процесс продолжил работу)'
);