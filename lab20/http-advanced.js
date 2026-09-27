import http from 'node:http';
import https from 'node:https';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const HTTP_PORT = 3000;
const HTTPS_PORT = 3443;
const GROUP = 'ББМО-01-23';

const PUBLIC_DIR = path.join(__dirname, 'public');
const ACCESS_LOG = path.join(__dirname, 'access.log');

const cache = new Map();

const metrics = {
    group: GROUP,
    total: 0,
    byMethod: {},
    byStatus: {},
    startedAt: Date.now()
};


// ==========================================
// ЛОГИРОВАНИЕ
// ==========================================

function logRequest(method, url, status) {
    const line =
        `[${new Date().toLocaleString('ru-RU')}] ` +
        `[${GROUP}] ${method} ${url} ${status}\n`;

    fs.appendFileSync(
        ACCESS_LOG,
        line,
        'utf8'
    );

    console.log(line.trim());

    metrics.total++;

    metrics.byMethod[method] =
        (metrics.byMethod[method] || 0) + 1;

    metrics.byStatus[status] =
        (metrics.byStatus[status] || 0) + 1;
}


// ==========================================
// MIDDLEWARE
// ==========================================

const middlewares = [];

function use(middleware) {
    middlewares.push(middleware);
}

function runMiddleware(req, res, index = 0) {
    if (index >= middlewares.length) {
        return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
        let called = false;

        const next = (error) => {
            if (called) {
                return;
            }

            called = true;

            if (error) {
                reject(error);
                return;
            }

            runMiddleware(
                req,
                res,
                index + 1
            )
                .then(resolve)
                .catch(reject);
        };

        try {
            middlewares[index](
                req,
                res,
                next
            );
        } catch (error) {
            reject(error);
        }
    });
}


// ==========================================
// ОБЩИЕ ЗАГОЛОВКИ
// ==========================================

use((req, res, next) => {
    res.setHeader(
        'X-Group',
        'BBMO-01-23'
    );

    res.setHeader(
        'X-Powered-By',
        'Node.js'
    );

    next();
});


// ==========================================
// MIDDLEWARE ЛОГИРОВАНИЯ
// ==========================================

use((req, res, next) => {
    console.log(
        `[MIDDLEWARE] ${req.method} ${req.url}`
    );

    next();
});


// ==========================================
// СТАТИКА
// ==========================================

function getMimeType(extension) {
    const types = {
        '.html': 'text/html; charset=utf-8',
        '.css': 'text/css; charset=utf-8',
        '.js': 'text/javascript; charset=utf-8',
        '.json': 'application/json; charset=utf-8',
        '.txt': 'text/plain; charset=utf-8',
        '.jpg': 'image/jpeg',
        '.png': 'image/png'
    };

    return (
        types[extension] ||
        'application/octet-stream'
    );
}

async function serveStatic(req, res) {
    if (
        req.method !== 'GET' ||
        !req.url.startsWith('/static/')
    ) {
        return false;
    }

    const relativePath =
        decodeURIComponent(
            req.url.substring('/static/'.length)
        );

    // Защита от path traversal
    if (
        relativePath.includes('..') ||
        path.isAbsolute(relativePath)
    ) {
        res.writeHead(403, {
            'Content-Type':
                'text/plain; charset=utf-8',
            'X-Group': 'BBMO-01-23'
        });

        res.end('403 Forbidden');

        return true;
    }

    const filePath = path.resolve(
        PUBLIC_DIR,
        relativePath
    );

    if (
        !filePath.startsWith(
            path.resolve(PUBLIC_DIR) +
            path.sep
        )
    ) {
        res.writeHead(403);

        res.end('403 Forbidden');

        return true;
    }

    try {
        const stat =
            await fs.promises.stat(filePath);

        if (!stat.isFile()) {
            res.writeHead(404);

            res.end('404 Not Found');

            return true;
        }

        const content =
            await fs.promises.readFile(filePath);

        const etag = `"${crypto
            .createHash('md5')
            .update(content)
            .digest('hex')}"`;

        const lastModified =
            stat.mtime.toUTCString();

        // ETag
        if (
            req.headers['if-none-match'] === etag
        ) {
            res.writeHead(304, {
                'ETag': etag,
                'Cache-Control':
                    'max-age=60',
                'X-Group':
                    'BBMO-01-23'
            });

            res.end();

            return true;
        }

        // If-Modified-Since
        if (
            req.headers['if-modified-since'] &&
            new Date(
                req.headers['if-modified-since']
            ) >= stat.mtime
        ) {
            res.writeHead(304, {
                'ETag': etag,
                'Last-Modified':
                    lastModified,
                'Cache-Control':
                    'max-age=60',
                'X-Group':
                    'BBMO-01-23'
            });

            res.end();

            return true;
        }

        res.writeHead(200, {
            'Content-Type':
                getMimeType(
                    path.extname(filePath)
                ),
            'Content-Length':
                content.length,
            'Cache-Control':
                'max-age=60',
            'ETag':
                etag,
            'Last-Modified':
                lastModified,
            'X-Group':
                'BBMO-01-23'
        });

        res.end(content);

        return true;

    } catch {
        res.writeHead(404, {
            'Content-Type':
                'text/plain; charset=utf-8',
            'X-Group':
                'BBMO-01-23'
        });

        res.end('404 Not Found');

        return true;
    }
}


// ==========================================
// КЭШИРОВАНИЕ
// ==========================================

function getCached(key) {
    const item = cache.get(key);

    if (!item) {
        return null;
    }

    if (
        Date.now() - item.time >
        60000
    ) {
        cache.delete(key);

        return null;
    }

    return item.data;
}

function setCached(key, data) {
    cache.set(key, {
        data,
        time: Date.now()
    });
}


// ==========================================
// ОСНОВНОЙ HTTP СЕРВЕР
// ==========================================

async function handleRequest(req, res) {
    let status = 200;

    try {
        const url =
            new URL(
                req.url,
                `http://${req.headers.host || 'localhost'}`
            );

        // Статика
        if (
            await serveStatic(req, res)
        ) {
            status =
                res.statusCode || 200;

            logRequest(
                req.method,
                req.url,
                status
            );

            return;
        }

        // Метрики
        if (
            req.method === 'GET' &&
            url.pathname === '/metrics'
        ) {
            const data = {
                group: GROUP,
                total: metrics.total,
                byMethod: metrics.byMethod,
                byStatus: metrics.byStatus,
                uptime: Math.floor(
                    (Date.now() -
                        metrics.startedAt) /
                    1000
                )
            };

            const cached =
                getCached('/metrics');

            if (cached) {
                data.cached = true;
            } else {
                setCached(
                    '/metrics',
                    data
                );

                data.cached = false;
            }

            res.writeHead(200, {
                'Content-Type':
                    'application/json; charset=utf-8',
                'Cache-Control':
                    'max-age=60',
                'X-Group':
                    'BBMO-01-23'
            });

            res.end(
                JSON.stringify(
                    data,
                    null,
                    2
                )
            );

            logRequest(
                req.method,
                req.url,
                200
            );

            return;
        }

        // Главная страница
        if (
            req.method === 'GET' &&
            url.pathname === '/'
        ) {
            res.writeHead(200, {
                'Content-Type':
                    'text/plain; charset=utf-8',
                'X-Group':
                    'BBMO-01-23'
            });

            res.end(
                `=== HTTP Advanced ===\n` +
                `Группа: ${GROUP}\n` +
                `HTTP порт: ${HTTP_PORT}\n` +
                `HTTPS порт: ${HTTPS_PORT}`
            );

            logRequest(
                req.method,
                req.url,
                200
            );

            return;
        }

        // Стриминг
        if (
            req.method === 'GET' &&
            url.pathname === '/stream'
        ) {
            const streamFile =
                path.join(
                    __dirname,
                    'public',
                    'index.html'
                );

            if (
                !fs.existsSync(streamFile)
            ) {
                status = 404;

                res.writeHead(404);

                res.end(
                    'Файл не найден'
                );

                logRequest(
                    req.method,
                    req.url,
                    status
                );

                return;
            }

            res.writeHead(200, {
                'Content-Type':
                    'text/html; charset=utf-8',
                'X-Group':
                    'BBMO-01-23'
            });

            const stream =
                fs.createReadStream(
                    streamFile
                );

            stream.on(
                'data',
                chunk => {
                    console.log(
                        `[STREAM] Передано ${chunk.length} байт`
                    );
                }
            );

            stream.on(
                'error',
                error => {
                    console.error(
                        `[STREAM ERROR] ${error.message}`
                    );

                    if (!res.headersSent) {
                        res.writeHead(500);
                    }

                    res.end(
                        'Stream error'
                    );
                }
            );

            stream.pipe(res);

            stream.on(
                'end',
                () => {
                    logRequest(
                        req.method,
                        req.url,
                        200
                    );
                }
            );

            return;
        }

        status = 404;

        res.writeHead(404, {
            'Content-Type':
                'text/plain; charset=utf-8',
            'X-Group':
                'BBMO-01-23'
        });

        res.end(
            '404 Not Found'
        );

        logRequest(
            req.method,
            req.url,
            status
        );

    } catch (error) {
        status = 500;

        console.error(
            `[ERROR] ${error.message}`
        );

        if (!res.headersSent) {
            res.writeHead(500, {
                'Content-Type':
                    'text/plain; charset=utf-8',
                'X-Group':
                    'BBMO-01-23'
            });

            res.end(
                '500 Internal Server Error'
            );
        }

        logRequest(
            req.method,
            req.url,
            status
        );
    }
}


// ==========================================
// HTTP
// ==========================================

const httpServer =
    http.createServer(
        async (req, res) => {
            try {
                await runMiddleware(
                    req,
                    res
                );

                await handleRequest(
                    req,
                    res
                );

            } catch (error) {
                console.error(
                    `[MIDDLEWARE ERROR] ${error.message}`
                );

                if (!res.headersSent) {
                    res.writeHead(500, {
                        'Content-Type':
                            'text/plain; charset=utf-8',
                        'X-Group':
                            'BBMO-01-23'
                    });

                    res.end(
                        '500 Internal Server Error'
                    );
                }
            }
        }
    );


// ==========================================
// HTTPS
// ==========================================

function createCertificate() {
    const keyPath =
        path.join(
            __dirname,
            'server-key.pem'
        );

    const certPath =
        path.join(
            __dirname,
            'server-cert.pem'
        );

    if (
        fs.existsSync(keyPath) &&
        fs.existsSync(certPath)
    ) {
        return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };
    }

    try {
        execFileSync(
            'openssl',
            [
                'req',
                '-x509',
                '-newkey',
                'rsa:2048',
                '-keyout',
                keyPath,
                '-out',
                certPath,
                '-days',
                '365',
                '-nodes',
                '-subj',
                '/CN=localhost'
            ],
            {
                stdio: 'ignore'
            }
        );

        return {
            key: fs.readFileSync(keyPath),
            cert: fs.readFileSync(certPath)
        };

    } catch {
        console.log(
            '[INFO] OpenSSL не найден.'
        );

        console.log(
            '[INFO] HTTPS будет пропущен.'
        );

        return null;
    }
}

const certificate =
    createCertificate();

let httpsServer = null;

if (certificate) {
    httpsServer =
        https.createServer(
            certificate,
            async (req, res) => {
                try {
                    await runMiddleware(
                        req,
                        res
                    );

                    await handleRequest(
                        req,
                        res
                    );

                } catch (error) {
                    console.error(
                        `[HTTPS ERROR] ${error.message}`
                    );

                    if (!res.headersSent) {
                        res.writeHead(500);

                        res.end(
                            '500 Internal Server Error'
                        );
                    }
                }
            }
        );
}


// ==========================================
// ОБРАБОТКА ОШИБОК
// ==========================================

httpServer.on(
    'error',
    error => {
        console.error(
            `[HTTP ERROR] ${error.message}`
        );
    }
);

httpServer.on(
    'clientError',
    (error, socket) => {
        console.error(
            `[CLIENT ERROR] ${error.message}`
        );

        socket.end(
            'HTTP/1.1 400 Bad Request\r\n\r\n'
        );
    }
);

if (httpsServer) {
    httpsServer.on(
        'error',
        error => {
            console.error(
                `[HTTPS ERROR] ${error.message}`
            );
        }
    );

    httpsServer.on(
        'clientError',
        (error, socket) => {
            console.error(
                `[HTTPS CLIENT ERROR] ${error.message}`
            );

            socket.end(
                'HTTP/1.1 400 Bad Request\r\n\r\n'
            );
        }
    );
}


// ==========================================
// ЗАПУСК
// ==========================================

httpServer.listen(
    HTTP_PORT,
    () => {
        console.log(
            `[INFO] HTTP-сервер запущен на порту ${HTTP_PORT}`
        );

        if (httpsServer) {
            httpsServer.listen(
                HTTPS_PORT,
                () => {
                    console.log(
                        `[INFO] HTTPS-сервер запущен на порту ${HTTPS_PORT}`
                    );
                }
            );
        }

        console.log(
            `[INFO] Группа: ${GROUP}`
        );
    }
);


// ==========================================
// SIGINT
// ==========================================

function shutdown() {
    console.log('');
    console.log(
        '[INFO] Завершение работы серверов...'
    );

    httpServer.close(
        () => {
            console.log(
                '[INFO] HTTP-сервер остановлен'
            );

            if (httpsServer) {
                httpsServer.close(
                    () => {
                        console.log(
                            '[INFO] HTTPS-сервер остановлен'
                        );

                        process.exit(0);
                    }
                );

                return;
            }

            process.exit(0);
        }
    );
}

process.on(
    'SIGINT',
    shutdown
);