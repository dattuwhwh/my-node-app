function errorHandler(err, req, res, next) {
    console.error('Ошибка:', err);

    const status = err.status || 500;

    res.status(status).json({
        error: err.message || 'Внутренняя ошибка сервера',
        status: status
    });
}

module.exports = errorHandler;