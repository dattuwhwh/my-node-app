import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});

console.log('=== Генерация 100 000 студентов ===');

const batchSize = 1000;
const total = 100000;

for (let start = 0; start < total; start += batchSize) {
    const values = [];

    for (let i = 0; i < batchSize && start + i < total; i++) {
        const number = start + i + 1;

        values.push([
            `Студент ${number}`,
            'ББМО-01-23',
            3,
            Number((6 + Math.random() * 4).toFixed(2))
        ]);
    }

    await connection.query(
        `INSERT INTO students
         (name, group_name, course, grade)
         VALUES ?`,
        [values]
    );

    console.log(`Добавлено: ${Math.min(start + batchSize, total)} / ${total}`);
}

console.log('Генерация завершена');

await connection.end();