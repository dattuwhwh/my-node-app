import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

/**
 * Создаёт директорию (рекурсивно), если её ещё нет.
 */
async function ensureDir(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    // recursive: true — не бросает ошибку, если директория существует
    await fs.mkdir(fullPath, { recursive: true });
    console.log(`✓ Директория готова: ${fullPath}`);
    return fullPath;
  } catch (err) {
    throw new Error(`Не удалось создать ${fullPath}: ${err.message}`);
  }
}

/**
 * Возвращает список элементов директории (файлы и подкаталоги).
 */
async function listDir(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    // withFileTypes: true — получаем объекты Dirent с методом isDirectory()
    const entries = await fs.readdir(fullPath, { withFileTypes: true });
    return entries.map((e) => ({
      name: e.name,
      type: e.isDirectory() ? 'DIR ' : 'FILE',
    }));
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Директория не найдена: ${fullPath}`);
    }
    throw err;
  }
}

/**
 * Рекурсивно удаляет директорию.
 */
async function removeDir(relativePath) {
  const fullPath = path.join(ROOT, relativePath);
  try {
    // recursive: true удаляет содержимое; force: true не бросает ошибку, если нет
    await fs.rm(fullPath, { recursive: true, force: true });
    console.log(`✓ Удалено: ${fullPath}`);
  } catch (err) {
    throw new Error(`Ошибка удаления ${fullPath}: ${err.message}`);
  }
}

async function main() {
  try {
    await ensureDir('output/temp');
    await fs.writeFile(path.join(ROOT, 'output/temp/a.txt'), 'A');
    await fs.writeFile(path.join(ROOT, 'output/temp/b.txt'), 'B');

    const items = await listDir('output/temp');
    console.log('Содержимое output/temp:');
    items.forEach((i) => console.log(`  [${i.type}] ${i.name}`));

    await removeDir('output/temp');
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();