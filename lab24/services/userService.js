import { User } from '../models/user.js';

export class UserService {

    static async findAll(
        filter = {},
        options = {}
    ) {
        console.log(
            '[SERVICE] Получение пользователей'
        );

        return User.findAll(
            filter,
            options
        );
    }

    static async count(filter = {}) {
        return User.count(filter);
    }

    static async findById(id) {

        const user =
            await User.findById(id);

        if (!user) {
            const error =
                new Error('User not found');

            error.status = 404;

            throw error;
        }

        return user;
    }

    static async create(data) {

        console.log(
            `[SERVICE] Создание пользователя: ${data.email}`
        );

        const existing =
            await User.findByEmail(data.email);

        if (existing) {
            const error =
                new Error('Email already exists');

            error.status = 409;

            throw error;
        }

        const user =
            await User.create(data);

        console.log(
            `[MODEL] insertOne: ${data.email}`
        );

        console.log(
            `[SERVICE] Email отправлен: ${data.email}`
        );

        return user;
    }

    static async update(id, data) {

        const user =
            await User.update(id, data);

        if (!user) {
            const error =
                new Error('User not found');

            error.status = 404;

            throw error;
        }

        return user;
    }

    static async delete(id) {

        const deleted =
            await User.delete(id);

        if (!deleted) {
            const error =
                new Error('User not found');

            error.status = 404;

            throw error;
        }

        return true;
    }

    static async search(text) {
        return User.search(text);
    }

    static async statistics() {
        return User.statistics();
    }
}