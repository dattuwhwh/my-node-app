import 'dotenv/config';
import { MongoClient } from 'mongodb';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();

        const db = client.db(dbName);
        const students = db.collection('students');

        console.log('=== Задание 3. Расширенные возможности MongoDB ===');
        console.log('Группа: ББМО-01-23\n');

        // ==========================================
        // Подготовка данных
        // ==========================================

        await students.deleteMany({});

        const data = [];

        const names = [
            'Иванов Иван',
            'Петров Петр',
            'Сидоров Алексей',
            'Кузнецова Анна',
            'Смирнов Дмитрий',
            'Васильева Мария'
        ];

        const groups = [
            'ББМО-01-23',
            'ББМО-02-23'
        ];

        for (let i = 0; i < 100; i++) {
            data.push({
                name: names[i % names.length],
                group_name: groups[i % groups.length],
                course: (i % 4) + 1,
                grade: 5 + (i % 6),
                email: `student${i}@example.com`,
                created_at: new Date()
            });
        }

        await students.insertMany(data);

        console.log('[OK] Добавлено документов:', data.length);

        // ==========================================
        // 1. CURSOR
        // ==========================================

        console.log('\n=== 1. CURSOR ===');

        const cursor = students
            .find({})
            .sort({ grade: -1 })
            .batchSize(10);

        let cursorCount = 0;

        for await (const student of cursor) {
            if (cursorCount < 5) {
                console.log(
                    `${student.name} | ${student.group_name} | ${student.grade}`
                );
            }

            cursorCount++;
        }

        console.log('Обработано через cursor:', cursorCount);

        // ==========================================
        // 2. AGGREGATION — СРЕДНЯЯ ОЦЕНКА ПО ГРУППАМ
        // ==========================================

        console.log('\n=== 2. AGGREGATION ===');

        const averageByGroup = await students.aggregate([
            {
                $group: {
                    _id: '$group_name',
                    averageGrade: {
                        $avg: '$grade'
                    },
                    studentsCount: {
                        $sum: 1
                    }
                }
            },
            {
                $sort: {
                    averageGrade: -1
                }
            }
        ]).toArray();

        console.log('Средняя оценка по группам:');

        for (const group of averageByGroup) {
            console.log(
                `${group._id}: средняя=${group.averageGrade.toFixed(2)}, студентов=${group.studentsCount}`
            );
        }

        // ==========================================
        // 3. AGGREGATION — КОЛИЧЕСТВО ПО КУРСАМ
        // ==========================================

        console.log('\n=== КОЛИЧЕСТВО СТУДЕНТОВ ПО КУРСАМ ===');

        const byCourse = await students.aggregate([
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

        for (const course of byCourse) {
            console.log(`Курс ${course._id}: ${course.count}`);
        }

        // ==========================================
        // 4. TOP 10
        // ==========================================

        console.log('\n=== TOP 10 СТУДЕНТОВ ===');

        const topStudents = await students.aggregate([
            {
                $sort: {
                    grade: -1
                }
            },
            {
                $limit: 10
            },
            {
                $project: {
                    _id: 0,
                    name: 1,
                    group_name: 1,
                    grade: 1
                }
            }
        ]).toArray();

        for (const student of topStudents) {
            console.log(
                `${student.name} | ${student.group_name} | ${student.grade}`
            );
        }

        // ==========================================
        // 5. INDEX GROUP
        // ==========================================

        console.log('\n=== 5. ИНДЕКСЫ ===');

        await students.createIndex(
            { group_name: 1 },
            {
                name: 'idx_group'
            }
        );

        console.log('[OK] Индекс group_name создан');

        // ==========================================
        // 6. СОСТАВНОЙ ИНДЕКС
        // ==========================================

        await students.createIndex(
            {
                group_name: 1,
                grade: -1
            },
            {
                name: 'idx_group_grade'
            }
        );

        console.log('[OK] Составной индекс group_name + grade создан');

        // ==========================================
        // 7. UNIQUE EMAIL
        // ==========================================

        await students.createIndex(
            {
                email: 1
            },
            {
                unique: true,
                name: 'idx_unique_email'
            }
        );

        console.log('[OK] Уникальный индекс email создан');

        // ==========================================
        // 8. EXPLAIN
        // ==========================================

        console.log('\n=== 6. EXPLAIN ===');

        const explainResult = await students
            .find({
                group_name: 'ББМО-01-23'
            })
            .sort({
                grade: -1
            })
            .explain('executionStats');

        console.log(
            'Использован индекс:',
            explainResult.queryPlanner.winningPlan.inputStage?.indexName ??
            explainResult.queryPlanner.winningPlan.inputStage?.inputStage?.indexName ??
            'COLLSCAN'
        );

        console.log(
            'Количество проверенных документов:',
            explainResult.executionStats.totalDocsExamined
        );

        console.log(
            'Количество найденных документов:',
            explainResult.executionStats.nReturned
        );

        // ==========================================
        // 9. TEXT SEARCH
        // ==========================================

        console.log('\n=== 7. TEXT SEARCH ===');

        try {
            await students.createIndex(
                {
                    name: 'text'
                },
                {
                    name: 'idx_name_text'
                }
            );

            console.log('[OK] Текстовый индекс создан');
        } catch (error) {
            console.log('[INFO] Текстовый индекс уже существует');
        }

        const searchResult = await students
            .find(
                {
                    $text: {
                        $search: 'Иван'
                    }
                },
                {
                    projection: {
                        _id: 0,
                        name: 1,
                        grade: 1,
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
            .limit(10)
            .toArray();

        console.log('Результат текстового поиска:');

        for (const student of searchResult) {
            console.log(student);
        }

        // ==========================================
        // 10. STREAMING / CURSOR MEMORY DEMO
        // ==========================================

        console.log('\n=== 8. STREAMING ===');

        const streamCursor = students
            .find({})
            .batchSize(20);

        let processed = 0;

        for await (const student of streamCursor) {
            processed++;

            if (processed <= 3) {
                console.log('Обработка:', student.name);
            }
        }

        console.log('Обработано потоково:', processed);

        console.log('\n[OK] Задание 3 выполнено');

    } catch (error) {
        console.error('[ERROR]', error);
    } finally {
        await client.close();
    }
}

main();