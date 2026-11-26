export async function errorMiddleware(ctx, next) {
    try {
        await next();
    } catch (error) {
        console.error(
            `[ERROR] ${error.message}`
        );

        ctx.status = error.status || 500;

        ctx.body = {
            error: error.message || 'Internal server error',
            status: ctx.status
        };
    }
}