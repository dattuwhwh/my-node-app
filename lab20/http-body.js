import http from 'node:http';

const PORT = 3000;
const GROUP = 'ББМО-01-23';
const MAX_BODY_SIZE = 1024 * 1024; // 1 МБ

function sendJson(response, statusCode, data) {
    response.writeHead(statusCode, {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Powered-By': 'Node.js',
        'X-Group': 'BBMO-01-23',
        'Cache-Control': 'no-cache'
    });

    response.end(
        JSON.stringify(data, null, 2)
    );
}

function sendText(response, statusCode, data, contentType = 'text/plain') {
    response.writeHead(statusCode, {
        'Content-Type': `${contentType}; charset=utf-8`,
        'X-Powered-By': 'Node.js',
        'X-Group': 'BBMO-01-23',
        'Cache-Control': 'no-cache'
    });

    response.end(data);
}

function readBody(request, response) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        let totalSize = 0;
        let tooLarge = false;

        request.on('data', (chunk) => {
            totalSize += chunk.length;

            if (totalSize > MAX_BODY_SIZE) {
                tooLarge = true;

                response.writeHead(413, {
                    'Content-Type': 'text/plain; charset=utf-8',
                    'X-Powered-By': 'Node.js',
                    'X-Group': 'BBMO-01-23'
                });

                response.end(
                    '413 Payload Too Large'
                );

                request.destroy();

                reject(
                    new Error('Body size exceeds 1 MB')
                );

                return;
            }

            chunks.push(chunk);
        });

        request.on('end', () => {
            if (tooLarge) {
                return;
            }

            const body = Buffer.concat(chunks);

            resolve({
                body,
                size: totalSize
            });
        });

        request.on('error', (error) => {
            reject(error);
        });
    });
}

const server = http.createServer(async (request, response) => {
    const { method, url } = request;

    const time = new Date().toLocaleString('ru-RU');

    console.log(
        `[${time}] ${method} ${url}`
    );

    if (method !== 'POST') {
        sendText(
            response,
            405,
            'Method Not Allowed'
        );

        return;
    }

    try {
        const { body, size } =
            await readBody(request, response);

        const contentType =
            request.headers['content-type'] || '';

        console.log(
            `[${time}] Размер тела: ${size} байт`
        );

        console.log(
            `[${time}] Content-Type: ${contentType}`
        );

        // ==========================================
        // POST /echo
        // ==========================================

        if (url === '/echo') {
            if (contentType.includes('application/json')) {
                try {
                    const data = JSON.parse(
                        body.toString('utf8')
                    );

                    data.group = GROUP;

                    sendJson(
                        response,
                        200,
                        data
                    );
                } catch {
                    sendJson(
                        response,
                        400,
                        {
                            error: 'Некорректный JSON'
                        }
                    );
                }

                return;
            }

            if (contentType.includes('text/plain')) {
                sendText(
                    response,
                    200,
                    body.toString('utf8')
                );

                return;
            }

            if (
                contentType.includes(
                    'application/octet-stream'
                )
            ) {
                response.writeHead(200, {
                    'Content-Type':
                        'application/octet-stream',
                    'X-Powered-By': 'Node.js',
                    'X-Group': 'BBMO-01-23'
                });

                response.end(body);

                return;
            }

            // Любой другой Content-Type
            response.writeHead(200, {
                'Content-Type':
                    contentType || 'application/octet-stream',
                'X-Powered-By': 'Node.js',
                'X-Group': 'BBMO-01-23'
            });

            response.end(body);

            return;
        }

        // ==========================================
        // POST /form
        // ==========================================

        if (url === '/form') {
            if (
                contentType.includes(
                    'application/x-www-form-urlencoded'
                )
            ) {
                const formData =
                    new URLSearchParams(
                        body.toString('utf8')
                    );

                const data = {};

                for (const [key, value] of formData) {
                    data[key] = value;
                }

                sendJson(
                    response,
                    200,
                    data
                );

                return;
            }

            sendJson(
                response,
                400,
                {
                    error:
                        'Ожидается application/x-www-form-urlencoded'
                }
            );

            return;
        }

        // ==========================================
        // Неизвестный маршрут
        // ==========================================

        sendJson(
            response,
            404,
            {
                error: 'Маршрут не найден'
            }
        );

    } catch (error) {
        console.error(
            `[ERROR] ${error.message}`
        );
    }
});

server.on('error', (error) => {
    console.error(
        `[SERVER ERROR] ${error.message}`
    );
});

server.listen(PORT, () => {
    console.log(
        `HTTP-сервер POST запущен на порту ${PORT}`
    );

    console.log(
        `Группа: ${GROUP}`
    );

    console.log(
        'Максимальный размер тела: 1 МБ'
    );
});