import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 10
});

let connection;

try {
    console.log('=== 3.7 Транзакция ===');

    connection = await pool.getConnection();

    await connection.beginTransaction();

    console.log('Транзакция начата');

    await connection.execute(
        `INSERT INTO students
         (name, group_name, course, grade)
         VALUES (?, ?, ?, ?)`,
        ['Транзакция 1', 'ББМО-01-23', 3, 8.50]
    );

    await connection.execute(
    `INSERT INTO students
     (name, group_name, course, grade)
     VALUES (?, ?, ?, ?)`,
    [null, 'ББМО-01-23', 3, 9.00]
);

    await connection.commit();

    console.log('COMMIT выполнен');
    console.log('Данные сохранены');
} catch (error) {
    console.error('Ошибка транзакции:', error.message);

    if (connection) {
        await connection.rollback();
        console.log('ROLLBACK выполнен');
    }
} finally {
    if (connection) {
        connection.release();
        console.log('Соединение возвращено в пул');
    }

    await pool.end();
    console.log('Пул закрыт');
}