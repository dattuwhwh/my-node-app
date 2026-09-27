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

const studentId = 1;

console.log('=== 2.9 DELETE ===');

const [result] = await connection.execute(
    `DELETE FROM students
     WHERE id = ?`,
    [studentId]
);

console.log('Удаление студента ID:', studentId);
console.log('affectedRows:', result.affectedRows);

await connection.end();

console.log('Соединение закрыто');