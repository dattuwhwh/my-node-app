/**
 * Middleware авторизации.
 * Пропускает запрос дальше только при наличии заголовка Authorization.
 */
export async function auth(ctx, next) {
  const authHeader = ctx.headers['authorization'];

  if (!authHeader) {
    // Заголовок отсутствует — 401 Unauthorized
    ctx.status = 401;
    ctx.body = {
      error: 'Требуется заголовок Authorization',
      status: 401,
    };
    return;
  }

  // Заголовок есть — сохраняем его в ctx.state (пригодится дальше)
  ctx.state.token = authHeader;

  // Продолжаем обработку
  await next();
}