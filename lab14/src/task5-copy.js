import fsp from 'fs/promises';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const THRESHOLD = 1024 * 1024; // 1 МБ

/**
 * Универсальное копирование: маленькие файлы — readFile/writeFile,
 * большие (> 1 МБ) — через потоки.
 */
async function smartCopy(srcRel, destRel) {
  const src = path.join(ROOT, srcRel);
  const dest = path.join(ROOT, destRel);
  try {
    const stats = await fsp.stat(src);
    // Создаём папку назначения при необходимости
    await fsp.mkdir(path.dirname(dest), { recursive: true });

    if (stats.size > THRESHOLD) {
      // Потоковое копирование — не грузим весь файл в память
      await pipeline(fs.createReadStream(src), fs.createWriteStream(dest));
      console.log(`✓ [streams] ${srcRel} → ${destRel} (${(stats.size / 1024 / 1024).toFixed(2)} МБ)`);
    } else {
      // Небольшой файл — просто читаем целиком
      const data = await fsp.readFile(src);
      await fsp.writeFile(dest, data);
      console.log(`✓ [buffer]  ${srcRel} → ${destRel} (${stats.size} байт)`);
    }
  } catch (err) {
    if (err.code === 'ENOENT') {
      throw new Error(`Источник не найден: ${src}`);
    }
    throw new Error(`Ошибка копирования ${srcRel} → ${destRel}: ${err.message}`);
  }
}

async function main() {
  try {
    // Создадим тестовые файлы: маленький и большой
    await fsp.mkdir(path.join(ROOT, 'data'), { recursive: true });
    await fsp.writeFile(path.join(ROOT, 'data/small.txt'), 'Небольшой текст');

    // Большой файл создадим через поток, чтобы не съесть память
    const bigPath = path.join(ROOT, 'data/large.bin');
    const ws = fs.createWriteStream(bigPath);
    for (let i = 0; i < 20; i++) ws.write(Buffer.alloc(64 * 1024, 1));
    await new Promise((r) => ws.end(r));

    await smartCopy('data/small.txt', 'output/small-copy.txt');
    await smartCopy('data/large.bin', 'output/large-copy.bin');
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();