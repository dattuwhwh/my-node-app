import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

import { logger } from './middleware/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { auth } from './middleware/auth.js';

const app = new Koa();
const router = new Router();
const PORT = 3000;

// ─── Глобальные middleware (порядок важен!) ───────────────────────────

// 1. Обработчик ошибок должен стоять ПЕРВЫМ,
//    чтобы обернуть все остальные middleware
app.use(errorHandler);

// 2. Логирование — вторым
app.use(logger);

// 3. Парсер тела запроса
app.use(bodyParser());

// ─── Публичные маршруты ───────────────────────────────────────────────

router.get('/', (ctx) => {
  ctx.type = 'text/html; charset=utf-8';
  ctx.body = `
    <h1>Лабораторная работа №15</h1>
    <p>Поддубская Дарья Сергеевна, группа 401</p>
    <p>Время: ${new Date().toLocaleString('ru-RU')}</p>
    <ul>
      <li><a href="/public">/public</a> — открытый маршрут</li>
      <li><a href="/protected">/protected</a> — только с Authorization</li>
      <li><a href="/error">/error</a> — демонстрация ошибки</li>
    </ul>
  `;
});

router.get('/public', (ctx) => {
  ctx.body = { message: 'Это публичный маршрут, доступен без авторизации' };
});

// ─── Защищённый маршрут ───────────────────────────────────────────────

// Подключаем middleware авторизации ТОЛЬКО к этому маршруту
router.get('/protected', auth, (ctx) => {
  ctx.body = {
    message: 'Доступ разрешён',
    token: ctx.state.token,
  };
});

// ─── Маршрут, выбрасывающий ошибку ────────────────────────────────────

router.get('/error', () => {
  // Умышленно бросаем исключение — его перехватит errorHandler
  throw new Error('Тестовая ошибка');
});

// ─── Маршрут с кастомным статусом ошибки ──────────────────────────────

router.get('/teapot', () => {
  const err = new Error('Я — чайник');
  err.status = 418;
  throw err;
});

// Подключаем маршруты
app.use(router.routes());
app.use(router.allowedMethods());

// Глобальный перехватчик ошибок Koa (на случай, если что-то
// не поймал наш errorHandler — чтобы не упасть)
app.on('error', (err) => {
  // Уже логируется в errorHandler, здесь можно оставить пусто
});

// Запуск
app.listen(PORT, () => {
  console.log(`✓ Сервер запущен: http://localhost:${PORT}`);
  console.log('  GET /           — главная страница');
  console.log('  GET /public     — публичный маршрут');
  console.log('  GET /protected  — защищённый (нужен Authorization)');
  console.log('  GET /error      — тестовая ошибка 500');
  console.log('  GET /teapot     — кастомный статус 418');
});