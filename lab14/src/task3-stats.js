import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

/**
 * Форматирует размер в человекочитаемый вид.
 */
function formatSize(bytes) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(2)} КБ`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(2)} МБ`;
  return `${(bytes / 1024 ** 3).toFixed(2)} ГБ`;
}

/**
 * Выводит информацию о файле: размер, даты, тип.
 */
async function fileInfo(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    const stats = await fs.stat(fullPath);
    console.log(`Файл: ${relativePath}`);
    console.log(`  Размер:        ${formatSize(stats.size)} (${stats.size} байт)`);
    console.log(`  Создан:        ${stats.birthtime.toLocaleString('ru-RU')}`);
    console.log(`  Изменён:       ${stats.mtime.toLocaleString('ru-RU')}`);
    console.log(`  Это файл:      ${stats.isFile()}`);
    console.log(`  Это директория:${stats.isDirectory()}`);
    return stats;
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Объект не найден: ${fullPath}`);
    }
    throw err;
  }
}

/**
 * Проверяет существование пути без выбрасывания исключения.
 */
async function exists(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    // fs.access без флагов проверяет только существование
    await fs.access(fullPath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  try {
    // Подготовка: создадим файл с известным содержимым
    await fs.mkdir(path.join(ROOT, 'data'), { recursive: true });
    await fs.writeFile(path.join(ROOT, 'data/input.txt'), 'x'.repeat(5000));

    await fileInfo('data/input.txt');

    console.log('data/input.txt существует:', await exists('data/input.txt'));
    console.log('data/nope.txt существует: ', await exists('data/nope.txt'));
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();