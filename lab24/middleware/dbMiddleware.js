import { getDB } from '../db.js';

export async function dbMiddleware(ctx, next) {
    ctx.db = getDB();

    await next();
}