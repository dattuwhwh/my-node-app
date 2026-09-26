/**
 * Middleware логирования.
 * Фиксирует время начала и окончания запроса, метод, путь и длительность.
 */
export async function logger(ctx, next) {
  // Фиксируем время старта
  const start = Date.now();

  // Форматируем дату начала в формате YYYY-MM-DD HH:mm:ss
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const stamp =
    `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
    `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;

  // Передаём управление дальше по цепочке middleware
  await next();

  // Вычисляем длительность
  const ms = Date.now() - start;

  // Выводим строку вида: [2024-01-15 14:30:25] GET /users - 15ms
  console.log(`[${stamp}] ${ctx.method} ${ctx.path} - ${ms}ms`);
}