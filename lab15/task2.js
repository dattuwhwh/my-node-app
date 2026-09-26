import Koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';

const app = new Koa();
const router = new Router();
const PORT = 3000;

// Подключаем парсер JSON-тела
app.use(bodyParser());

// ─── In-memory хранилище пользователей ────────────────────────────────
let users = [
  { id: 1, name: 'Иванов Иван', group: 'ББМО-01-23' },
  { id: 2, name: 'Петрова Мария', group: 'ББМО-01-23' },
  { id: 3, name: 'Смирнов Алексей', group: 'ББМО-02-23' },
];

// Счётчик для генерации ID новых пользователей
let nextId = 4;

// ─── Маршруты ─────────────────────────────────────────────────────────

/**
 * GET /api/users — получить всех пользователей
 */
router.get('/api/users', (ctx) => {
  ctx.body = users;
});

/**
 * GET /api/users/:id — получить пользователя по ID (доп. удобство)
 */
router.get('/api/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const user = users.find((u) => u.id === id);
  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден' };
    return;
  }
  ctx.body = user;
});

/**
 * POST /api/users — создать нового пользователя
 * Тело: { "name": "...", "group": "..." }
 */
router.post('/api/users', (ctx) => {
  const { name, group } = ctx.request.body || {};

  // Валидация: обязательные поля
  if (!name || !group) {
    ctx.status = 400;
    ctx.body = { error: 'Поля "name" и "group" обязательны' };
    return;
  }

  const newUser = { id: nextId++, name, group };
  users.push(newUser);

  ctx.status = 201; // Created
  ctx.body = newUser;
});

/**
 * PUT /api/users/:id — обновить пользователя
 */
router.put('/api/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const user = users.find((u) => u.id === id);

  if (!user) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден' };
    return;
  }

  const { name, group } = ctx.request.body || {};

  if (!name || !group) {
    ctx.status = 400;
    ctx.body = { error: 'Поля "name" и "group" обязательны' };
    return;
  }

  user.name = name;
  user.group = group;

  ctx.body = user;
});

/**
 * DELETE /api/users/:id — удалить пользователя
 */
router.delete('/api/users/:id', (ctx) => {
  const id = Number(ctx.params.id);
  const index = users.findIndex((u) => u.id === id);

  if (index === -1) {
    ctx.status = 404;
    ctx.body = { error: 'Пользователь не найден' };
    return;
  }

  const [deleted] = users.splice(index, 1);
  ctx.body = { message: 'Пользователь удалён', user: deleted };
});

// Подключаем маршрутизатор
app.use(router.routes());
app.use(router.allowedMethods());

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✓ Сервер запущен: http://localhost:${PORT}`);
  console.log('  GET    /api/users');
  console.log('  GET    /api/users/:id');
  console.log('  POST   /api/users');
  console.log('  PUT    /api/users/:id');
  console.log('  DELETE /api/users/:id');
});