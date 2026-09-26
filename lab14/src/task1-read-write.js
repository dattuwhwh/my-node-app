// Импортируем promises-версию модуля файловой системы
// Используем только асинхронные методы (fs.promises)
import fs from 'fs/promises';
// Модуль path — для корректной работы с путями на разных ОС
import path from 'path';
// fileURLToPath нужен для получения __dirname в ES-модулях
import { fileURLToPath } from 'url';

// Определяем текущую директорию (аналог __dirname в CommonJS)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
// Корень проекта — на уровень выше папки src
const ROOT = path.join(__dirname, '..');

/**
 * Читает текстовый файл и возвращает его содержимое.
 * @param {string} relativePath — путь относительно корня проекта
 * @returns {Promise<string>}
 */
async function readFile(relativePath) {
  // Все пути формируются через path.join — относительные к текущей директории
  const fullPath = path.join(ROOT, relativePath);
  try {
    // Асинхронное чтение файла в кодировке utf-8
    const content = await fs.readFile(fullPath, 'utf-8');
    return content;
  } catch (err) {
    // Обработка ошибок: файл не найден, нет прав доступа и т.д.
    if (err.code === 'ENOENT') {
      throw new Error(`Файл не найден: ${fullPath}`);
    }
    if (err.code === 'EACCES') {
      throw new Error(`Нет прав на чтение: ${fullPath}`);
    }
    throw err;
  }
}

/**
 * Записывает текст в файл. Если директория не существует — создаёт её.
 */
async function writeFile(relativePath, content) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    // Гарантируем существование директории назначения (recursive: true)
    await fs.mkdir(path.dirname(fullPath), { recursive: true });
    // Записываем файл, перезаписывая при наличии
    await fs.writeFile(fullPath, content, 'utf-8');
    console.log(`✓ Файл записан: ${fullPath}`);
  } catch (err) {
    throw new Error(`Ошибка записи ${fullPath}: ${err.message}`);
  }
}

// Точка входа
async function main() {
  try {
    await writeFile('data/input.txt', 'Привет, Node.js!\nСтрока 2\nСтрока 3');
    const text = await readFile('data/input.txt');
    console.log('Прочитано:\n' + text);

    // Демонстрация обработки ошибки — несуществующий файл
    await readFile('data/missing.txt');
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();