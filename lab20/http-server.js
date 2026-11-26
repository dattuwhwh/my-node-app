import http from 'node:http';

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const STUDENT = 'Поддубская Дарья Сергеевна';

const server = http.createServer((request, response) => {
    const { method, url } = request;

    const time = new Date().toLocaleString('ru-RU');

    console.log(
        `[${time}] ${method} ${url}`
    );

    response.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
    );

    if (method === 'GET' && url === '/') {
        response.writeHead(200);

        response.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Лабораторная работа №20</title>
            </head>
            <body>
                <h1>Лабораторная работа №20</h1>
                <p><strong>Группа:</strong> ${GROUP}</p>
                <p><strong>Метод:</strong> GET</p>
                <p><strong>URL:</strong> /</p>
            </body>
            </html>
        `);

        return;
    }

    if (method === 'GET' && url === '/about') {
        response.writeHead(200);

        response.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>О студенте</title>
            </head>
            <body>
                <h1>О студенте</h1>
                <p><strong>Группа:</strong> ${GROUP}</p>
                <p><strong>Студент:</strong> ${STUDENT}</p>
            </body>
            </html>
        `);

        return;
    }

    response.writeHead(404);

    response.end(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>404 Not Found</title>
        </head>
        <body>
            <h1>404 Not Found</h1>
            <p>Путь ${url} не найден</p>
        </body>
        </html>
    `);
});

server.listen(PORT, () => {
    console.log(
        `Сервер запущен на порту ${PORT}`
    );

    console.log(
        `Группа: ${GROUP}`
    );

    console.log(
        `Студент: ${STUDENT}`
    );
});