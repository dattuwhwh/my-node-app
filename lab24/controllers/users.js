import { UserService } from '../services/userService.js';

export async function getUsers(ctx) {

    const {
        page,
        limit,
        group_name,
        course,
        age_min,
        age_max,
        sort
    } = ctx.state.query;

    const filter = {};

    // Фильтр по группе
    if (group_name) {
        filter.group_name = group_name;
    }

    // Фильтр по курсу
    if (course !== undefined) {
        filter.course = course;
    }

    // Фильтр по возрасту
    if (
        age_min !== undefined ||
        age_max !== undefined
    ) {

        filter.age = {};

        if (age_min !== undefined) {
            filter.age.$gte = age_min;
        }

        if (age_max !== undefined) {
            filter.age.$lte = age_max;
        }
    }

    // Сортировка
    const descending =
        sort.startsWith('-');

    const field =
        descending
            ? sort.substring(1)
            : sort;

    const sortObject = {
        [field]: descending ? -1 : 1
    };

    // Общее количество
    const total =
        await UserService.count(filter);

    // Данные страницы
    const users =
        await UserService.findAll(
            filter,
            {
                skip: (page - 1) * limit,
                limit,
                sort: sortObject
            }
        );

    ctx.body = {

        data: users,

        pagination: {
            total,
            page,
            limit,
            pages: Math.ceil(
                total / limit
            )
        }
    };
}

export async function getUser(ctx) {

    const user =
        await UserService.findById(
            ctx.params.id
        );

    ctx.body = {
        data: user
    };
}

export async function createUser(ctx) {

    const user =
        await UserService.create(
            ctx.request.body
        );

    ctx.status = 201;

    ctx.body = {
        data: user
    };
}

export async function updateUser(ctx) {

    const user =
        await UserService.update(
            ctx.params.id,
            ctx.request.body
        );

    ctx.body = {
        data: user
    };
}

export async function deleteUser(ctx) {

    await UserService.delete(
        ctx.params.id
    );

    ctx.body = {
        data: {
            message: 'User deleted'
        }
    };
}

// Поиск
export async function searchUsers(ctx) {

    const query = ctx.query.q;

    if (!query) {

        ctx.status = 400;

        ctx.body = {
            error:
                'Query parameter q is required'
        };

        return;
    }

    const users =
        await UserService.search(query);

    ctx.body = {
        found: users.length,
        data: users
    };
}

// Статистика
export async function statistics(ctx) {

    const statistics =
        await UserService.statistics();

    ctx.body = statistics;
}

// CSV
export async function exportCSV(ctx) {

    const users =
        await UserService.findAll(
            {},
            {
                skip: 0,
                limit: 10000,
                sort: {
                    created_at: -1
                }
            }
        );

    const header =
        'name,email,group_name,age,course,created_at';

    const rows = users.map(user => {

        return [
            user.name,
            user.email,
            user.group_name,
            user.age,
            user.course ?? '',
            user.created_at
                ? user.created_at.toISOString()
                : ''
        ]
            .map(value =>
                `"${String(value)
                    .replaceAll('"', '""')}"`
            )
            .join(',');
    });

    ctx.type = 'text/csv; charset=utf-8';

    ctx.body = [
        header,
        ...rows
    ].join('\n');
}