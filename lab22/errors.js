async function testNotNull() {
    console.log('\n=== Ошибка NOT NULL ===');

    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT),
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        await connection.execute(
            `INSERT INTO students
             (name, group_name, course, grade)
             VALUES (?, ?, ?, ?)`,
            [null, 'ББМО-01-23', 3, 8.00]
        );
    } catch (error) {
        console.log('Код ошибки:', error.code);
        console.log('Сообщение:', error.message);
    } finally {
        await connection.end();
    }
}

await testNotNull();