import 'dotenv/config';
import { MongoClient, ObjectId } from 'mongodb';

const uri = process.env.MONGO_URI;
const dbName = process.env.MONGO_DB;

const client = new MongoClient(uri);

async function main() {
    try {
        await client.connect();

        const db = client.db(dbName);

        // Создаём коллекцию students, если её нет
        const collections = await db.listCollections().toArray();

        if (!collections.some(c => c.name === 'students')) {
            await db.createCollection('students');
        }

        const students = db.collection('students');

        // Очищаем коллекцию для повторяемого результата
        await students.deleteMany({});

        // Индекс
        await students.createIndex(
            { group_name: 1 },
            { name: 'idx_group_name' }
        );

        console.log('=== Задание 2. CRUD MongoDB ===');
        console.log('Группа: ББМО-01-23\n');

        // ==========================================
        // INSERT ONE
        // ==========================================

        const oneStudent = {
            name: 'Иванов Иван',
            group_name: 'ББМО-01-23',
            course: 2,
            grade: 8.5,
            created_at: new Date()
        };

        const insertOneResult = await students.insertOne(oneStudent);

        console.log('=== INSERT ONE ===');
        console.log('insertedId:', insertOneResult.insertedId);

        // ==========================================
        // INSERT MANY
        // ==========================================

        const manyStudents = [
            {
                name: 'Петров Петр',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 9.2,
                created_at: new Date()
            },
            {
                name: 'Сидоров Алексей',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 7.8,
                created_at: new Date()
            },
            {
                name: 'Кузнецова Анна',
                group_name: 'ББМО-01-23',
                course: 2,
                grade: 9.7,
                created_at: new Date()
            },
            {
                name: 'Смирнов Дмитрий',
                group_name: 'ББМО-02-23',
                course: 2,
                grade: 8.1,
                created_at: new Date()
            },
            {
                name: 'Васильева Мария',
                group_name: 'ББМО-02-23',
                course: 3,
                grade: 9.5,
                created_at: new Date()
            }
        ];

        const insertManyResult = await students.insertMany(manyStudents);

        console.log('\n=== INSERT MANY ===');
        console.log('Количество:', insertManyResult.insertedCount);
        console.log('ID:', insertManyResult.insertedIds);

        // ==========================================
        // FIND ALL
        // ==========================================

        console.log('\n=== FIND ALL ===');

        const allStudents = await students.find({}).toArray();

        for (const student of allStudents) {
            console.log(
                student._id.toString(),
                student.name,
                student.group_name,
                student.course,
                student.grade
            );
        }

        // ==========================================
        // FIND FILTER
        // ==========================================

        console.log('\n=== FIND ПО ГРУППЕ ББМО-01-23 ===');

        const groupStudents = await students
            .find({ group_name: 'ББМО-01-23' })
            .toArray();

        for (const student of groupStudents) {
            console.log(student.name, student.grade);
        }

        // ==========================================
        // SORT
        // ==========================================

        console.log('\n=== СОРТИРОВКА ПО ОЦЕНКЕ ===');

        const sortedStudents = await students
            .find({})
            .sort({ grade: -1 })
            .toArray();

        for (const student of sortedStudents) {
            console.log(`${student.name}: ${student.grade}`);
        }

        // ==========================================
        // PAGINATION
        // ==========================================

        console.log('\n=== ПАГИНАЦИЯ ===');

        const pageSize = 3;
        const page = 1;

        const pageStudents = await students
            .find({})
            .sort({ grade: -1 })
            .skip((page - 1) * pageSize)
            .limit(pageSize)
            .toArray();

        for (const student of pageStudents) {
            console.log(`${student.name}: ${student.grade}`);
        }

        // ==========================================
        // FIND ONE BY ID
        // ==========================================

        console.log('\n=== FIND ONE ПО ID ===');

        const foundStudent = await students.findOne({
            _id: insertOneResult.insertedId
        });

        console.log(foundStudent);

        // ==========================================
        // UPDATE ONE
        // ==========================================

        console.log('\n=== UPDATE ONE ===');

        const updateOneResult = await students.updateOne(
            { _id: insertOneResult.insertedId },
            {
                $set: {
                    grade: 9.0
                },
                $inc: {
                    course: 1
                }
            }
        );

        console.log('matchedCount:', updateOneResult.matchedCount);
        console.log('modifiedCount:', updateOneResult.modifiedCount);

        // ==========================================
        // UPDATE MANY
        // ==========================================

        console.log('\n=== UPDATE MANY ===');

        const updateManyResult = await students.updateMany(
            { group_name: 'ББМО-01-23' },
            {
                $set: {
                    updated: true
                }
            }
        );

        console.log('matchedCount:', updateManyResult.matchedCount);
        console.log('modifiedCount:', updateManyResult.modifiedCount);

        // ==========================================
        // PROJECTION
        // ==========================================

        console.log('\n=== PROJECTION ===');

        const projection = await students
            .find(
                { group_name: 'ББМО-01-23' },
                {
                    projection: {
                        _id: 0,
                        name: 1,
                        grade: 1
                    }
                }
            )
            .toArray();

        console.log(projection);

        // ==========================================
        // DELETE ONE
        // ==========================================

        console.log('\n=== DELETE ONE ===');

        const deleteOneResult = await students.deleteOne({
            _id: insertOneResult.insertedId
        });

        console.log('deletedCount:', deleteOneResult.deletedCount);

        // ==========================================
        // DELETE MANY
        // ==========================================

        console.log('\n=== DELETE MANY ===');

        const deleteManyResult = await students.deleteMany({
            group_name: 'ББМО-02-23'
        });

        console.log('deletedCount:', deleteManyResult.deletedCount);

        // ==========================================
        // ИТОГ
        // ==========================================

        console.log('\n=== ОСТАВШИЕСЯ СТУДЕНТЫ ===');

        const remaining = await students.find({}).toArray();

        for (const student of remaining) {
            console.log(
                `${student.name} | ${student.group_name} | ${student.grade}`
            );
        }

        console.log('\n[OK] Задание 2 выполнено');

    } catch (error) {
        console.error('[ERROR]', error);
    } finally {
        await client.close();
    }
}

main();