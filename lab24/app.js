import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import { connectDB } from './db.js';
import { User } from './models/user.js';

import userRoutes from './routes/users.js';

import { dbMiddleware } from './middleware/dbMiddleware.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';
import { loggerMiddleware } from './middleware/loggerMiddleware.js';

const app = new Koa();

const PORT = process.env.PORT || 3000;

// X-Group
app.use(async (ctx, next) => {
    ctx.set(
        'X-Group',
        'BBMO-01-23'
    );

    await next();
});

// Централизованные ошибки
app.use(errorMiddleware);

// Логирование
app.use(loggerMiddleware);

// JSON
app.use(bodyParser());

// MongoDB в ctx.db
app.use(dbMiddleware);

// Главная страница
app.use(async (ctx, next) => {
    if (ctx.path === '/') {
        ctx.body = {
            data: {
                message: 'REST API MongoDB + Koa.js',
                group: 'ББМО-01-23'
            }
        };

        return;
    }

    await next();
});

// REST API
app.use(
    userRoutes.routes()
);

app.use(
    userRoutes.allowedMethods()
);

// 404
app.use(async ctx => {
    ctx.status = 404;

    ctx.body = {
        error: 'Not found',
        status: 404
    };
});

// Запуск
async function start() {
    try {
        await connectDB();

        await User.init();

        app.listen(
            PORT,
            () => {
                console.log(
                    `[INFO] Koa-сервер на порту ${PORT}`
                );

                console.log(
                    '[INFO] Группа: ББМО-01-23'
                );
            }
        );

    } catch (error) {
        console.error(
            '[ERROR] Ошибка запуска:',
            error.message
        );

        process.exit(1);
    }
}

start();