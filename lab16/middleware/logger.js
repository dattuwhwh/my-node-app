const fs = require('fs');
const path = require('path');

const logFile = path.join(__dirname, '..', 'data', 'operations.log');

function formatDate(date) {
    return date.toISOString()
        .replace('T', ' ')
        .replace('Z', '');
}

function logger(req, res, next) {
    const startTime = new Date();

    res.on('finish', () => {
        const endTime = new Date();
        const duration = endTime - startTime;

        const message =
            `[${formatDate(startTime)}] ` +
            `${req.method} ${req.originalUrl} ` +
            `${res.statusCode} - ${duration}ms`;

        console.log(message);

        fs.appendFile(
            logFile,
            message + '\n',
            (error) => {
                if (error) {
                    console.error('Ошибка записи в лог:', error.message);
                }
            }
        );
    });

    next();
}

module.exports = logger;