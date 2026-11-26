const express = require('express');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const {
    body,
    validationResult
} = require('express-validator');

const logger = require('./middleware/logger');

const {
    JWT_SECRET,
    authenticateToken,
    requireAdmin
} = require('./middleware/auth');

const errorHandler = require('./middleware/errorHandler');

const app = express();

const PORT = 3000;
const GROUP = 'ББМО-01-23';

const DATA_DIR = path.join(__dirname, 'data');
const OPERATIONS_LOG = path.join(DATA_DIR, 'operations.log');

if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

if (!fs.existsSync(OPERATIONS_LOG)) {
    fs.writeFileSync(OPERATIONS_LOG, '');
}

/* =========================================================
   НАСТРОЙКИ EXPRESS
========================================================= */

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/* Middleware логирования */
app.use(logger);

/* Middleware сжатия */
app.use(compression());

/* Rate Limit: максимум 100 запросов в минуту */
const limiter = rateLimit({
    windowMs: 60 * 1000,
    limit: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        error: 'Слишком много запросов',
        status: 429
    }
});

app.use(limiter);


/* =========================================================
   ДАННЫЕ ПОЛЬЗОВАТЕЛЕЙ
========================================================= */

const users = [
    {
        id: 1,
        email: 'admin@lab16.local',
        password: bcrypt.hashSync('admin123', 10),
        name: 'Администратор',
        role: 'admin'
    }
];


/* =========================================================
   ГЕНЕРАЦИЯ КНИГ
========================================================= */

const titles = [
    'Война и мир',
    'Преступление и наказание',
    'Мастер и Маргарита',
    'Отцы и дети',
    'Евгений Онегин',
    'Анна Каренина',
    'Идиот',
    'Герой нашего времени',
    'Обломов',
    'Мёртвые души',
    'Доктор Живаго',
    'Мы',
    'Пикник на обочине',
    'Двенадцать стульев',
    'Тихий Дон',
    'Белая гвардия',
    'Дети капитана Гранта',
    'Таинственный остров',
    'Собачье сердце',
    'Записки охотника'
];

const authors = [
    'Лев Толстой',
    'Фёдор Достоевский',
    'Михаил Булгаков',
    'Иван Тургенев',
    'Александр Пушкин',
    'Николай Гоголь',
    'Антон Чехов',
    'Иван Гончаров',
    'Михаил Лермонтов',
    'Александр Солженицын'
];

const genres = [
    'роман',
    'повесть',
    'фантастика',
    'драма',
    'классика',
    'приключения',
    'детектив'
];

const books = [];

function generateISBN(index) {
    return `978-5-00-${String(10000 + index).padStart(5, '0')}`;
}

function generateBooks() {
    books.length = 0;

    for (let i = 1; i <= 100; i++) {
        books.push({
            id: i,
            title: titles[(i - 1) % titles.length],
            author: authors[(i - 1) % authors.length],
            year: 1800 + ((i * 17) % 225),
            genre: genres[(i - 1) % genres.length],
            isbn: generateISBN(i),
            available: i % 4 !== 0,
            reviews: []
        });
    }
}

generateBooks();


/* =========================================================
   ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
========================================================= */

function getNextBookId() {
    if (books.length === 0) {
        return 1;
    }

    return Math.max(...books.map(book => book.id)) + 1;
}

function getNextUserId() {
    if (users.length === 0) {
        return 1;
    }

    return Math.max(...users.map(user => user.id)) + 1;
}

function saveOperation(operation) {
    const line =
        `[${new Date().toISOString()}] ${operation}\n`;

    fs.appendFile(
        OPERATIONS_LOG,
        line,
        error => {
            if (error) {
                console.error('Ошибка записи операции:', error.message);
            }
        }
    );
}

function validateRequest(req, res, next) {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({
            error: 'Некорректные входные данные',
            status: 400,
            details: errors.array()
        });
    }

    next();
}


/* =========================================================
   ЗАДАНИЕ 1
   ПРОСТОЙ HTTP-СЕРВЕР
========================================================= */

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Лабораторная работа №16</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background: #f2f2f2;
                    margin: 0;
                    padding: 40px;
                }

                .container {
                    max-width: 900px;
                    margin: auto;
                    background: white;
                    padding: 30px;
                    border-radius: 10px;
                    box-shadow: 0 0 15px rgba(0,0,0,0.1);
                }

                h1 {
                    color: #333;
                }

                a {
                    color: #0066cc;
                }

                li {
                    margin: 10px 0;
                }
            </style>
        </head>

        <body>
            <div class="container">
                <h1>Лабораторная работа №16</h1>

                <h2>Исследование методов создания простого сервера
                с использованием Express.js</h2>

                <p><strong>Группа:</strong> ${GROUP}</p>

                <p>
                    <strong>Дата и время:</strong>
                    ${new Date().toLocaleString('ru-RU')}
                </p>

                <p>
                    Добро пожаловать на сервер лабораторной работы №16!
                </p>

                <h3>Доступные маршруты:</h3>

                <ul>
                    <li><a href="/">Главная</a></li>
                    <li><a href="/about">О разработчике</a></li>
                    <li><a href="/contacts">Контакты</a></li>
                    <li>GET /api/books</li>
                    <li>GET /api/books/:id</li>
                    <li>POST /api/books</li>
                    <li>PUT /api/books/:id</li>
                    <li>DELETE /api/books/:id</li>
                    <li>GET /api/books/search</li>
                    <li>GET /api/books/stats</li>
                    <li>GET /api/books/export</li>
                    <li>GET /api/books/recommendations</li>
                    <li>GET /api/books/available</li>
                    <li>POST /auth/register</li>
                    <li>POST /auth/login</li>
                    <li>GET /api-docs</li>
                </ul>
            </div>
        </body>
        </html>
    `);
});


app.get('/about', (req, res) => {
    res.send(`
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>О разработчике</title>
        </head>

        <body>
            <h1>О разработчике</h1>

            <p>
                Лабораторная работа №16 выполнена студентом
                группы ${GROUP}.
            </p>

            <p>
                Разработка выполнена с использованием
                Node.js и Express.js.
            </p>

            <a href="/">Вернуться на главную</a>
        </body>
        </html>
    `);
});


app.get('/contacts', (req, res) => {
    res.send(`
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Контакты</title>
        </head>

        <body>
            <h1>Контактная информация</h1>

            <p>Email: student@example.com</p>
            <p>Группа: ${GROUP}</p>

            <a href="/">Вернуться на главную</a>
        </body>
        </html>
    `);
});


/* =========================================================
   ЗАДАНИЕ 2 + 4 + 5
   REST API BOOKS
========================================================= */

/**
 * @swagger
 * /api/books:
 *   get:
 *     summary: Получить список книг
 *     responses:
 *       200:
 *         description: Список книг
 */
app.get('/api/books', authenticateToken, (req, res) => {

    let result = [...books];

    const {
        author,
        year,
        yearFrom,
        yearTo,
        limit,
        page,
        sort,
        search
    } = req.query;


    /* Фильтр по автору */
    if (author) {
        result = result.filter(book =>
            book.author.toLowerCase().includes(
                author.toLowerCase()
            )
        );
    }


    /* Фильтр по году */
    if (year) {
        const numericYear = Number(year);

        result = result.filter(book =>
            book.year === numericYear
        );
    }


    /* Фильтр по диапазону лет */
    if (yearFrom) {
        result = result.filter(book =>
            book.year >= Number(yearFrom)
        );
    }

    if (yearTo) {
        result = result.filter(book =>
            book.year <= Number(yearTo)
        );
    }


    /* Поиск */
    if (search) {
        const searchText = search.toLowerCase();

        result = result.filter(book =>
            book.title.toLowerCase().includes(searchText) ||
            book.author.toLowerCase().includes(searchText)
        );
    }


    /* Сортировка */
    if (sort === 'title') {
        result.sort((a, b) =>
            a.title.localeCompare(b.title, 'ru')
        );
    }

    if (sort === '-year') {
        result.sort((a, b) =>
            b.year - a.year
        );
    }


    const total = result.length;


    /* Пагинация */
    if (limit || page) {

        const itemsPerPage =
            Math.max(Number(limit) || 10, 1);

        const currentPage =
            Math.max(Number(page) || 1, 1);

        const start =
            (currentPage - 1) * itemsPerPage;

        result = result.slice(
            start,
            start + itemsPerPage
        );

        return res.json({
            page: currentPage,
            limit: itemsPerPage,
            total: total,
            totalPages: Math.ceil(
                total / itemsPerPage
            ),
            books: result
        });
    }


    res.json(result);
});


/* =========================================================
   ПОИСК
========================================================= */

app.get('/api/books/search', authenticateToken, (req, res) => {

    const author = req.query.author;

    if (!author) {
        return res.status(400).json({
            error: 'Необходимо указать автора',
            status: 400
        });
    }

    const result = books.filter(book =>
        book.author.toLowerCase().includes(
            author.toLowerCase()
        )
    );

    res.json(result);
});


/* =========================================================
   СТАТИСТИКА
========================================================= */

app.get('/api/books/stats', authenticateToken, (req, res) => {

    const authorStats = {};
    const genreStats = {};

    books.forEach(book => {

        authorStats[book.author] =
            (authorStats[book.author] || 0) + 1;

        genreStats[book.genre] =
            (genreStats[book.genre] || 0) + 1;
    });

    const years = books.map(book => book.year);

    res.json({
        totalBooks: books.length,

        byAuthors: authorStats,

        oldestYear: Math.min(...years),

        newestYear: Math.max(...years),

        byGenres: genreStats
    });
});


/* =========================================================
   ПОЛУЧЕНИЕ КНИГИ ПО ID
========================================================= */

app.get('/api/books/:id', authenticateToken, (req, res) => {

    const id = Number(req.params.id);

    const book = books.find(book =>
        book.id === id
    );

    if (!book) {
        return res.status(404).json({
            error: 'Книга не найдена',
            status: 404
        });
    }

    res.json(book);
});


/* =========================================================
   СОЗДАНИЕ КНИГИ
========================================================= */

app.post(
    '/api/books',
    authenticateToken,
    requireAdmin,

    [
        body('title')
            .trim()
            .notEmpty()
            .withMessage('Название книги не должно быть пустым'),

        body('author')
            .trim()
            .notEmpty()
            .withMessage('Автор не должен быть пустым'),

        body('year')
            .isInt({ min: 0, max: new Date().getFullYear() })
            .withMessage('Некорректный год'),

        body('genre')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Жанр не должен быть пустым')
    ],

    validateRequest,

    (req, res) => {

        const {
            title,
            author,
            year,
            genre = 'классика'
        } = req.body;


        /* Проверка дубликата */
        const duplicate = books.find(book =>
            book.title.toLowerCase() === title.toLowerCase() &&
            book.author.toLowerCase() === author.toLowerCase()
        );

        if (duplicate) {
            return res.status(400).json({
                error: 'Такая книга этого автора уже существует',
                status: 400
            });
        }


        const newBook = {
            id: getNextBookId(),
            title,
            author,
            year: Number(year),
            genre,
            isbn: generateISBN(
                getNextBookId()
            ),
            available: true,
            reviews: []
        };

        books.push(newBook);

        saveOperation(
            `CREATE BOOK id=${newBook.id}`
        );

        res.status(201).json(newBook);
    }
);


/* =========================================================
   ОБНОВЛЕНИЕ КНИГИ
========================================================= */

app.put(
    '/api/books/:id',
    authenticateToken,
    requireAdmin,

    [
        body('title')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Название не должно быть пустым'),

        body('author')
            .optional()
            .trim()
            .notEmpty()
            .withMessage('Автор не должен быть пустым'),

        body('year')
            .optional()
            .isInt({ min: 0, max: new Date().getFullYear() })
            .withMessage('Некорректный год')
    ],

    validateRequest,

    (req, res) => {

        const id = Number(req.params.id);

        const book = books.find(book =>
            book.id === id
        );

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена',
                status: 404
            });
        }

        const allowedFields = [
            'title',
            'author',
            'year',
            'genre',
            'available'
        ];

        allowedFields.forEach(field => {

            if (req.body[field] !== undefined) {
                book[field] = req.body[field];
            }

        });

        if (book.year !== undefined) {
            book.year = Number(book.year);
        }

        saveOperation(
            `UPDATE BOOK id=${id}`
        );

        res.json(book);
    }
);


/* =========================================================
   УДАЛЕНИЕ КНИГИ
========================================================= */

app.delete(
    '/api/books/:id',
    authenticateToken,
    requireAdmin,

    (req, res) => {

        const id = Number(req.params.id);

        const index = books.findIndex(book =>
            book.id === id
        );

        if (index === -1) {
            return res.status(404).json({
                error: 'Книга не найдена',
                status: 404
            });
        }

        books.splice(index, 1);

        saveOperation(
            `DELETE BOOK id=${id}`
        );

        res.json({
            message: 'Книга успешно удалена',
            id
        });
    }
);


/* =========================================================
   REVIEWS
========================================================= */

app.post(
    '/api/books/:id/reviews',
    authenticateToken,

    [
        body('text')
            .trim()
            .notEmpty()
            .withMessage('Текст отзыва не должен быть пустым'),

        body('rating')
            .isInt({ min: 1, max: 5 })
            .withMessage('Оценка должна быть от 1 до 5')
    ],

    validateRequest,

    (req, res) => {

        const id = Number(req.params.id);

        const book = books.find(book =>
            book.id === id
        );

        if (!book) {
            return res.status(404).json({
                error: 'Книга не найдена',
                status: 404
            });
        }

        const review = {
            id: book.reviews.length + 1,
            user: req.user.email,
            text: req.body.text,
            rating: Number(req.body.rating),
            date: new Date().toISOString()
        };

        book.reviews.push(review);

        saveOperation(
            `ADD REVIEW book=${id} user=${req.user.email}`
        );

        res.status(201).json(review);
    }
);


/* =========================================================
   ДОСТУПНЫЕ КНИГИ
========================================================= */

app.get(
    '/api/books/available',
    authenticateToken,

    (req, res) => {

        const result = books.filter(book =>
            book.available === true
        );

        res.json(result);
    }
);


/* =========================================================
   РЕКОМЕНДАЦИИ
========================================================= */

app.get(
    '/api/books/recommendations',
    authenticateToken,

    (req, res) => {

        const genre = req.query.genre;

        let result;

        if (genre) {
            result = books.filter(book =>
                book.genre.toLowerCase() ===
                genre.toLowerCase()
            );
        } else {
            result = books.slice(0, 10);
        }

        res.json(result);
    }
);


/* =========================================================
   EXPORT
========================================================= */

app.get(
    '/api/books/export',
    authenticateToken,

    (req, res) => {

        const format = req.query.format || 'json';

        if (format === 'json') {

            res.json(books);

            return;
        }

        if (format === 'csv') {

            const header =
                'id,title,author,year,genre,isbn,available\n';

            const rows = books.map(book =>
                [
                    book.id,
                    `"${book.title.replace(/"/g, '""')}"`,
                    `"${book.author.replace(/"/g, '""')}"`,
                    book.year,
                    `"${book.genre}"`,
                    book.isbn,
                    book.available
                ].join(',')
            );

            const csv = header + rows.join('\n');

            res.header(
                'Content-Type',
                'text/csv; charset=utf-8'
            );

            res.attachment('books.csv');

            res.send(csv);

            return;
        }

        res.status(400).json({
            error: 'Формат должен быть json или csv',
            status: 400
        });
    }
);


/* =========================================================
   IMPORT CSV
========================================================= */

app.post(
    '/api/books/import',
    authenticateToken,
    requireAdmin,

    (req, res) => {

        const csv = req.body.csv;

        if (!csv || typeof csv !== 'string') {
            return res.status(400).json({
                error: 'Необходимо передать CSV в поле csv',
                status: 400
            });
        }

        const lines = csv
            .split('\n')
            .map(line => line.trim())
            .filter(Boolean);

        if (lines.length < 2) {
            return res.status(400).json({
                error: 'CSV-файл не содержит данных',
                status: 400
            });
        }

        let imported = 0;

        for (let i = 1; i < lines.length; i++) {

            const parts = lines[i].split(',');

            if (parts.length < 5) {
                continue;
            }

            const title = parts[1]
                .replace(/^"|"$/g, '')
                .replace(/""/g, '"');

            const author = parts[2]
                .replace(/^"|"$/g, '')
                .replace(/""/g, '"');

            const year = Number(parts[3]);
            const genre = parts[4]
                .replace(/^"|"$/g, '');

            if (!title || !author || !year) {
                continue;
            }

            books.push({
                id: getNextBookId(),
                title,
                author,
                year,
                genre,
                isbn: generateISBN(getNextBookId()),
                available: true,
                reviews: []
            });

            imported++;
        }

        saveOperation(
            `IMPORT BOOKS count=${imported}`
        );

        res.json({
            message: 'Импорт завершен',
            imported
        });
    }
);


/* =========================================================
   АУТЕНТИФИКАЦИЯ
========================================================= */

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Регистрация пользователя
 */
app.post(
    '/auth/register',

    [
        body('email')
            .isEmail()
            .withMessage('Некорректный email'),

        body('password')
            .isLength({ min: 6 })
            .withMessage('Пароль должен содержать минимум 6 символов'),

        body('name')
            .trim()
            .notEmpty()
            .withMessage('Имя не должно быть пустым')
    ],

    validateRequest,

    async (req, res) => {

        const {
            email,
            password,
            name
        } = req.body;

        const existingUser = users.find(user =>
            user.email.toLowerCase() ===
            email.toLowerCase()
        );

        if (existingUser) {
            return res.status(400).json({
                error: 'Пользователь уже существует',
                status: 400
            });
        }

        const hashedPassword =
            await bcrypt.hash(password, 10);

        const user = {
            id: getNextUserId(),
            email,
            password: hashedPassword,
            name,
            role: 'user'
        };

        users.push(user);

        res.status(201).json({
            message: 'Регистрация выполнена успешно',
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
);


/* =========================================================
   LOGIN
========================================================= */

app.post(
    '/auth/login',

    [
        body('email')
            .isEmail()
            .withMessage('Некорректный email'),

        body('password')
            .notEmpty()
            .withMessage('Введите пароль')
    ],

    validateRequest,

    async (req, res) => {

        const {
            email,
            password
        } = req.body;

        const user = users.find(item =>
            item.email.toLowerCase() ===
            email.toLowerCase()
        );

        if (!user) {
            return res.status(401).json({
                error: 'Неверный email или пароль',
                status: 401
            });
        }

        const passwordCorrect =
            await bcrypt.compare(
                password,
                user.password
            );

        if (!passwordCorrect) {
            return res.status(401).json({
                error: 'Неверный email или пароль',
                status: 401
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            },
            JWT_SECRET,
            {
                expiresIn: '2h'
            }
        );

        res.json({
            message: 'Авторизация успешна',
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role
            }
        });
    }
);


/* =========================================================
   ADMIN
========================================================= */

app.get(
    '/api/admin',
    authenticateToken,
    requireAdmin,

    (req, res) => {

        res.json({
            message: 'Добро пожаловать в административную панель',
            user: req.user
        });
    }
);


/* =========================================================
   ОШИБКИ
========================================================= */

app.get('/error', (req, res, next) => {

    const error = new Error(
        'Тестовая ошибка сервера'
    );

    error.status = 500;

    next(error);
});


app.get('/async-error', async (req, res, next) => {

    try {

        throw new Error(
            'Тестовая асинхронная ошибка'
        );

    } catch (error) {

        error.status = 500;

        next(error);
    }
});


/* =========================================================
   SWAGGER
========================================================= */

const swaggerOptions = {
    definition: {
        openapi: '3.0.0',

        info: {
            title: 'Лабораторная работа №16 - Library API',
            version: '1.0.0',
            description:
                'REST API библиотеки на Express.js'
        },

        servers: [
            {
                url: `http://localhost:${PORT}`
            }
        ]
    },

    apis: [__filename]
};

const swaggerSpec =
    swaggerJsdoc(swaggerOptions);

app.use(
    '/api-docs',
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec)
);


/* =========================================================
   404
========================================================= */

app.use((req, res) => {

    res.status(404).json({
        error: 'Маршрут не найден',
        status: 404
    });
});


/* =========================================================
   ERROR HANDLER
========================================================= */

app.use(errorHandler);


/* =========================================================
   ЗАПУСК СЕРВЕРА
========================================================= */

app.listen(PORT, () => {

    console.log(
        `==========================================`
    );

    console.log(
        `Лабораторная работа №16`
    );

    console.log(
        `Группа: ${GROUP}`
    );

    console.log(
        `Сервер запущен: http://localhost:${PORT}`
    );

    console.log(
        `Swagger: http://localhost:${PORT}/api-docs`
    );

    console.log(
        `Книг создано: ${books.length}`
    );

    console.log(
        `Администратор: admin@lab16.local`
    );

    console.log(
        `Пароль: admin123`
    );

    console.log(
        `==========================================`
    );
});