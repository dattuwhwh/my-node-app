export async function loggerMiddleware(ctx, next) {
    const start = Date.now();

    await next();

    const duration = Date.now() - start;

    console.log(
        `[${new Date().toISOString()}] ` +
        `${ctx.method} ${ctx.path} ` +
        `${ctx.status} ${duration}ms`
    );
}