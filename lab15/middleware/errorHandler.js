/**
 * Middleware обработки ошибок.
 * Перехватывает любые исключения и возвращает JSON с описанием.
 */
export async function errorHandler(ctx, next) {
  try {
    // Пытаемся выполнить всю цепочку middleware
    await next();
  } catch (err) {
    // Определяем статус: либо задан явно (err.status), либо 500
    const status = err.status || err.statusCode || 500;

    // Устанавливаем HTTP-статус ответа
    ctx.status = status;

    // Формируем тело ответа
    ctx.body = {
      error: status === 500 ? 'Внутренняя ошибка сервера' : err.message,
      status,
    };

    // Логируем ошибку в консоль для отладки
    console.error(`✗ [${status}] ${err.message}`);

    // Сообщаем Koa, что ошибка обработана (иначе он выведет свой стек)
    ctx.app.emit('error', err, ctx);
  }
}