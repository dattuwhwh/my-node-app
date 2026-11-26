import { ObjectId } from 'mongodb';
import { getDB } from '../db.js';

export class User {

    static collection() {
        return getDB().collection('users');
    }

    static async init() {
        await this.collection().createIndex(
            { email: 1 },
            {
                unique: true,
                name: 'unique_email'
            }
        );

        await this.collection().createIndex(
            { group_name: 1 },
            {
                name: 'idx_group_name'
            }
        );

        await this.collection().createIndex(
            {
                name: 'text',
                email: 'text'
            },
            {
                name: 'idx_user_search'
            }
        );
    }

    static async findAll(
        filter = {},
        options = {}
    ) {
        const {
            skip = 0,
            limit = 10,
            sort = { created_at: -1 }
        } = options;

        return this.collection()
            .find(filter)
            .sort(sort)
            .skip(skip)
            .limit(limit)
            .toArray();
    }

    static async count(filter = {}) {
        return this.collection()
            .countDocuments(filter);
    }

    static async findById(id) {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        return this.collection().findOne({
            _id: new ObjectId(id)
        });
    }

    static async findByEmail(email) {
        return this.collection().findOne({
            email
        });
    }

    static async create(data) {
        const user = {
            name: data.name,
            email: data.email,
            group_name: data.group_name,
            age: data.age,
            course: data.course ?? null,
            created_at: new Date()
        };

        const result =
            await this.collection().insertOne(user);

        return this.findById(
            result.insertedId.toString()
        );
    }

    static async update(id, data) {
        if (!ObjectId.isValid(id)) {
            return null;
        }

        const result =
            await this.collection().updateOne(
                {
                    _id: new ObjectId(id)
                },
                {
                    $set: data
                }
            );

        if (result.matchedCount === 0) {
            return null;
        }

        return this.findById(id);
    }

    static async delete(id) {
        if (!ObjectId.isValid(id)) {
            return false;
        }

        const result =
            await this.collection().deleteOne({
                _id: new ObjectId(id)
            });

        return result.deletedCount > 0;
    }

    // Поиск
    static async search(text) {
        return this.collection()
            .find(
                {
                    $text: {
                        $search: text
                    }
                },
                {
                    projection: {
                        _id: 1,
                        name: 1,
                        email: 1,
                        group_name: 1,
                        age: 1,
                        course: 1,
                        score: {
                            $meta: 'textScore'
                        }
                    }
                }
            )
            .sort({
                score: {
                    $meta: 'textScore'
                }
            })
            .limit(20)
            .toArray();
    }

    // Статистика
    static async statistics() {

        const total =
            await this.collection().countDocuments();

        const averageResult =
            await this.collection().aggregate([
                {
                    $match: {
                        age: {
                            $exists: true
                        }
                    }
                },
                {
                    $group: {
                        _id: null,
                        averageAge: {
                            $avg: '$age'
                        }
                    }
                }
            ]).toArray();

        const groupResult =
            await this.collection().aggregate([
                {
                    $group: {
                        _id: '$group_name',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        count: -1
                    }
                }
            ]).toArray();

        const courseResult =
            await this.collection().aggregate([
                {
                    $group: {
                        _id: '$course',
                        count: {
                            $sum: 1
                        }
                    }
                },
                {
                    $sort: {
                        _id: 1
                    }
                }
            ]).toArray();

        return {
            total,

            averageAge:
                averageResult.length > 0
                    ? Number(
                        averageResult[0]
                            .averageAge
                            .toFixed(2)
                    )
                    : 0,

            byGroup: Object.fromEntries(
                groupResult.map(item => [
                    item._id,
                    item.count
                ])
            ),

            byCourse: Object.fromEntries(
                courseResult
                    .filter(item => item._id !== null)
                    .map(item => [
                        String(item._id),
                        item.count
                    ])
            )
        };
    }
}