import Router from '@koa/router';

import {
    getUsers,
    getUser,
    createUser,
    updateUser,
    deleteUser,
    searchUsers,
    statistics,
    exportCSV
} from '../controllers/users.js';

import {
    validateCreateUser,
    validateUpdateUser,
    validateQuery
} from '../middleware/validationMiddleware.js';

const router = new Router({
    prefix: '/api'
});

// Список + пагинация + фильтрация + сортировка
router.get(
    '/users',
    validateQuery,
    getUsers
);

// Поиск
router.get(
    '/users/search',
    searchUsers
);

// Статистика
router.get(
    '/users/stats',
    statistics
);

// CSV
router.get(
    '/users/export',
    exportCSV
);

// Один пользователь
router.get(
    '/users/:id',
    getUser
);

// Создание
router.post(
    '/users',
    validateCreateUser,
    createUser
);

// Обновление
router.put(
    '/users/:id',
    validateUpdateUser,
    updateUser
);

// Удаление
router.delete(
    '/users/:id',
    deleteUser
);

export default router;