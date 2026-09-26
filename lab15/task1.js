// Импортируем Koa
import Koa from 'koa';

// Создаём экземпляр приложения
const app = new Koa();

// Порт, на котором будет слушать сервер
const PORT = 3000;

/**
 * Единственный middleware-обработчик.
 * При любом запросе возвращаем HTML-страницу с информацией о ЛР.
 */
app.use(async (ctx) => {
  // Устанавливаем тип содержимого — HTML с кодировкой UTF-8
  ctx.type = 'text/html; charset=utf-8';

  // Формируем текущую дату и время в удобочитаемом виде
  const now = new Date().toLocaleString('ru-RU');

  // Формируем HTML-страницу
  ctx.body = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <title>Лабораторная работа №15</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 700px;
          margin: 40px auto;
          padding: 20px;
          background: #f4f6f8;
          color: #222;
        }
        h1 { color: #2c3e50; }
        .card {
          background: #fff;
          border-radius: 8px;
          padding: 20px 30px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
        }
        .label { color: #888; }
        .value { font-weight: bold; }
      </style>
    </head>
    <body>
      <div class="card">
        <h1>Лабораторная работа №15</h1>
        <p><span class="label">Студент:</span> <span class="value">Поддубская Дарья Сергеевна</span></p>
        <p><span class="label">Группа:</span> <span class="value">401</span></p>
        <p><span class="label">Текущее время:</span> <span class="value">${now}</span></p>
        <hr>
        <p>Добро пожаловать! Это простой сервер на Koa.js.</p>
      </div>
    </body>
    </html>
  `;
});

// Запуск сервера
app.listen(PORT, () => {
  console.log(`✓ Сервер запущен: http://localhost:${PORT}`);
});