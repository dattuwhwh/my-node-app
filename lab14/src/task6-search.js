import fsp from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

/**
 * Рекурсивно обходит директорию и собирает файлы с заданным расширением.
 * @param {string} relDir — стартовая папка (относительно корня)
 * @param {string} ext    — расширение вида '.txt'
 * @returns {Promise<string[]>} — список относительных путей
 */
async function findByExt(relDir, ext) {
  const startDir = path.join(ROOT, relDir);
  const result = [];

  // Внутренняя рекурсивная функция
  async function walk(dir) {
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch (err) {
      // Нет прав/папка исчезла — пропускаем, но не падаем
      if (err.code === 'ENOENT' || err.code === 'EACCES') return;
      throw err;
    }

    for (const entry of entries) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        await walk(full);
      } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ext.toLowerCase()) {
        // Возвращаем путь относительно корня проекта
        result.push(path.relative(ROOT, full));
      }
    }
  }

  await walk(startDir);
  return result;
}

async function main() {
  try {
    // Подготовим тестовую структуру
    await fsp.mkdir(path.join(ROOT, 'data/sub1/sub2'), { recursive: true });
    await fsp.writeFile(path.join(ROOT, 'data/a.txt'), 'a');
    await fsp.writeFile(path.join(ROOT, 'data/b.md'), 'b');
    await fsp.writeFile(path.join(ROOT, 'data/sub1/c.txt'), 'c');
    await fsp.writeFile(path.join(ROOT, 'data/sub1/sub2/d.txt'), 'd');
    await fsp.writeFile(path.join(ROOT, 'data/sub1/sub2/e.log'), 'e');

    const txtFiles = await findByExt('data', '.txt');
    console.log('Найдены .txt файлы:');
    txtFiles.forEach((f) => console.log('  ' + f));
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();