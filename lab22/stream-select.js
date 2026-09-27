import mysql from 'mysql2';
import dotenv from 'dotenv';

dotenv.config();

const connection = mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('=== 3.6 Потоковая выборка ===');

let count = 0;
const start = Date.now();

const stream = connection
    .query(`
        SELECT id, name, group_name, course, grade
        FROM students
    `)
    .stream();

stream.on('data', (row) => {
    count++;

    if (count <= 5) {
        console.log(row);
    }

    if (count % 10000 === 0) {
        console.log(`Получено записей: ${count}`);
    }
});

stream.on('end', () => {
    const time = Date.now() - start;

    console.log('\n=== Результат ===');
    console.log('Всего записей:', count);
    console.log('Время выполнения:', `${time} мс`);

    connection.end();
});

stream.on('error', (error) => {
    console.error('Ошибка потока:', error.message);
    connection.end();
});