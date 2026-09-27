import http from 'node:http';

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const GROUP_HEADER = 'BBMO-01-23';

const server = http.createServer((request, response) => {
    const { method, url, headers } = request;

    console.log(
        `[${new Date().toLocaleString('ru-RU')}] ${method} ${url}`
    );

    // Общие HTTP-заголовки
    response.setHeader('X-Powered-By', 'Node.js');
    response.setHeader('X-Group', GROUP_HEADER);
    response.setHeader('Cache-Control', 'no-cache');

    // GET /headers
    if (method === 'GET' && url === '/headers') {
        response.setHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        response.writeHead(200);

        response.end(
            JSON.stringify(
                {
                    headers,
                    method: request.method,
                    url: request.url,
                    httpVersion: request.httpVersion
                },
                null,
                2
            )
        );

        return;
    }

    // GET /headers/set
    if (method === 'GET' && url === '/headers/set') {
        response.setHeader(
            'Content-Type',
            'text/html; charset=utf-8'
        );

        response.setHeader(
            'X-Custom-Header',
            'Lab20'
        );

        response.setHeader(
            'X-Student',
            'Poddubskaya-Darya'
        );

        response.writeHead(200);

        response.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Установка заголовков</title>
            </head>
            <body>
                <h1>Заголовки установлены</h1>

                <p><strong>Группа:</strong> ${GROUP}</p>

                <p>
                    <strong>X-Powered-By:</strong>
                    ${response.getHeader('X-Powered-By')}
                </p>

                <p>
                    <strong>X-Group:</strong>
                    ${response.getHeader('X-Group')}
                </p>

                <p>
                    <strong>X-Custom-Header:</strong>
                    ${response.getHeader('X-Custom-Header')}
                </p>

                <p>
                    <strong>X-Student:</strong>
                    ${response.getHeader('X-Student')}
                </p>
            </body>
            </html>
        `);

        return;
    }

    // GET /headers/check
    if (method === 'GET' && url === '/headers/check') {
        response.setHeader(
            'Content-Type',
            'application/json; charset=utf-8'
        );

        const hasContentType =
            response.hasHeader('Content-Type');

        const hasXGroup =
            response.hasHeader('X-Group');

        const hasUnknown =
            response.hasHeader('X-Unknown');

        // Демонстрация removeHeader()
        response.setHeader(
            'X-Temporary',
            'temporary'
        );

        response.removeHeader('X-Temporary');

        const temporaryRemoved =
            !response.hasHeader('X-Temporary');

        response.writeHead(200);

        response.end(
            JSON.stringify(
                {
                    hasContentType,
                    hasXGroup,
                    hasUnknown,
                    temporaryRemoved
                },
                null,
                2
            )
        );

        return;
    }

    // Неизвестный маршрут
    response.setHeader(
        'Content-Type',
        'text/html; charset=utf-8'
    );

    response.writeHead(404);

    response.end(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>404</title>
        </head>
        <body>
            <h1>404 Not Found</h1>
            <p>Путь ${url} не найден</p>
        </body>
        </html>
    `);
});

server.on('error', (error) => {
    console.error(
        `[ERROR] Ошибка сервера: ${error.message}`
    );
});

server.listen(PORT, () => {
    console.log(
        `HTTP-сервер заголовков запущен на порту ${PORT}`
    );

    console.log(`Группа: ${GROUP}`);
});