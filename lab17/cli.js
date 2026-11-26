#!/usr/bin/env node

const { Command } = require('commander');

const program = new Command();

const GROUP = 'ББМО-01-23';
const AUTHOR = 'Поддубская Дарья Сергеевна';

program
    .name('my-cli')
    .description('CLI-приложение для лабораторной работы №17')
    .version('1.0.0')
    .option('-v, --verbose', 'подробный вывод');

program
    .command('generate')
    .description('сгенерировать отчёт')
    .option('-t, --type <type>', 'тип отчёта', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .action((options) => {
        const type = options.type;
        const output = options.output || `./output.${type}`;

        const allowedTypes = ['html', 'pdf', 'json', 'csv'];

        if (!allowedTypes.includes(type)) {
            console.error(`Ошибка: недопустимый тип отчёта "${type}".`);
            console.error(
                'Допустимые значения: html, pdf, json, csv'
            );
            process.exitCode = 1;
            return;
        }

        const verbose = program.opts().verbose;

        if (options.dryRun) {
            console.log(
                `[DRY-RUN] Будет сгенерирован отчёт типа: ${type}`
            );
            console.log(
                `[DRY-RUN] Файл будет сохранён в: ${output}`
            );
            console.log(
                '[DRY-RUN] Действия не выполнены (режим проверки)'
            );
            return;
        }

        if (verbose) {
            console.log('[VERBOSE] Запуск генерации отчёта...');
            console.log(`[VERBOSE] Тип отчёта: ${type}`);
            console.log(`[VERBOSE] Путь сохранения: ${output}`);
        }

        if (options.force) {
            console.log('[INFO] Разрешена перезапись существующего файла.');
        }

        console.log(`Отчёт успешно сгенерирован: ${output}`);
    });

program
    .command('convert')
    .description('конвертировать файл')
    .option('-t, --type <type>', 'тип конвертации', 'html')
    .option('-o, --output <path>', 'путь для сохранения')
    .option('-f, --force', 'перезаписать существующий файл')
    .option('--dry-run', 'показать что будет сделано без выполнения')
    .argument('<input>', 'входной файл')
    .action((input, options) => {
        const output = options.output || `./converted.${options.type}`;

        if (options.dryRun) {
            console.log(`[DRY-RUN] Входной файл: ${input}`);
            console.log(`[DRY-RUN] Тип конвертации: ${options.type}`);
            console.log(`[DRY-RUN] Выходной файл: ${output}`);
            console.log(
                '[DRY-RUN] Действия не выполнены (режим проверки)'
            );
            return;
        }

        console.log(`Файл успешно конвертирован: ${input}`);
        console.log(`Результат сохранён: ${output}`);
    });

program.parse();