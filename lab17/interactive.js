#!/usr/bin/env node

const inquirer = require('inquirer').default;
const GROUP = 'ББМО-01-23';
const AUTHOR = 'Поддубская Дарья Сергеевна';

async function interactiveMode() {
    console.log('');
    console.log('=== Интерактивный режим ===');
    console.log('');

    const answers = await inquirer.prompt([
        {
            type: 'input',
            name: 'name',
            message: 'Введите ваше имя:',
            default: 'Дарья'
        },
        {
            type: 'select',
            name: 'format',
            message: 'Выберите формат отчёта:',
            choices: [
                { name: 'HTML', value: 'html' },
                { name: 'PDF', value: 'pdf' },
                { name: 'JSON', value: 'json' },
                { name: 'CSV', value: 'csv' }
            ]
        },
        {
            type: 'checkbox',
            name: 'options',
            message: 'Выберите дополнительные параметры:',
            choices: [
                { name: 'Подробный вывод', value: 'Подробный вывод' },
                { name: 'Перезапись файла', value: 'Перезапись файла' },
                { name: 'Проверочный режим', value: 'Проверочный режим' }
            ]
        },
        {
            type: 'confirm',
            name: 'confirm',
            message: 'Продолжить выполнение?',
            default: true
        },
        {
            type: 'password',
            name: 'password',
            message: 'Введите пароль:',
            mask: '*'
        }
    ]);

    console.log('');

    if (!answers.confirm) {
        console.log('Операция отменена пользователем.');
        return;
    }

    console.log('=== Результат ===');
    console.log(`Имя: ${answers.name}`);
    console.log(`Формат отчёта: ${answers.format}`);

    if (answers.options.length > 0) {
        console.log('Дополнительные параметры:');

        answers.options.forEach(option => {
            console.log(`- ${option}`);
        });
    } else {
        console.log('Дополнительные параметры не выбраны.');
    }

    console.log(`Группа: ${GROUP}`);
    console.log(`ФИО: ${AUTHOR}`);
    console.log('Пароль получен.');
    console.log('Операция успешно выполнена.');
}

async function nonInteractiveMode() {
    console.log('');
    console.log('=== Неинтерактивный режим ===');
    console.log('Интерактивный диалог отключён.');
    console.log(`Группа: ${GROUP}`);
    console.log(`ФИО: ${AUTHOR}`);
    console.log('Операция выполнена без вопросов пользователю.');
    console.log('');
}

async function main() {
    const args = process.argv.slice(2);

    if (args.includes('--no-interactive')) {
        await nonInteractiveMode();
        return;
    }

    await interactiveMode();
}

main().catch(error => {
    console.error('Ошибка:', error.message);
    process.exitCode = 1;
});