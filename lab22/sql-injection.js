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

const maliciousInput = "'; DROP TABLE students; --";

console.log('=== 2.10 SQL-инъекция ===');
console.log('Тестовая строка:', maliciousInput);

// Небезопасный вариант:
// const unsafeQuery = `SELECT * FROM students WHERE name = '${maliciousInput}'`;
// При конкатенации пользовательского ввода SQL может быть изменён.

// Безопасный вариант:
const [rows] = await connection.execute(
    `SELECT id, name, group_name, course, grade
     FROM students
     WHERE name = ?`,
    [maliciousInput]
);

console.log('\nРезультат безопасного параметризованного запроса:');
console.table(rows);

console.log('\nТаблица students не удаляется, потому что значение');
console.log('передаётся через параметр ?');

await connection.end();

console.log('Соединение закрыто');