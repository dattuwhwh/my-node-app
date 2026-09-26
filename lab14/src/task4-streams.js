import fs from 'fs';
import fsp from 'fs/promises';
import path from 'path';
import { pipeline } from 'stream/promises';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.join(__dirname, '..');

const BIG_FILE = path.join(ROOT, 'data/big-file.bin');
const OUT_FILE = path.join(ROOT, 'output/big-file-copy.bin');

/**
 * Генерирует большой файл (5 МБ) с помощью потока записи.
 * Использование потока позволяет не держать весь объём в памяти.
 */
async function createBigFile(sizeBytes = 5 * 1024 * 1024) {
  await fsp.mkdir(path.dirname(BIG_FILE), { recursive: true });
  await fsp.mkdir(path.dirname(OUT_FILE), { recursive: true });

  // writeStream создаёт/перезаписывает файл
  const ws = fs.createWriteStream(BIG_FILE);
  const chunk = Buffer.alloc(64 * 1024, 'A'); // 64 КБ буфер
  let written = 0;

  return new Promise((resolve, reject) => {
    ws.on('error', reject);
    ws.on('finish', resolve);

    // Функция дописывает данные порциями, пока не достигнут нужный размер
    const writeMore = () => {
      while (written < sizeBytes) {
        const remaining = sizeBytes - written;
        const buf = remaining >= chunk.length
          ? chunk
          : chunk.subarray(0, remaining);
        written += buf.length;

        // Если backpressure — ждём событие 'drain'
        if (!ws.write(buf)) {
          ws.once('drain', writeMore);
          return;
        }
      }
      ws.end();
    };
    writeMore();
  });
}

/**
 * Копирует файл с помощью потоков (для файлов > 1 МБ).
 */
async function copyWithStreams(src, dest) {
  // Читаем и пишем через потоки: память используется фиксированная (chunk)
  const rs = fs.createReadStream(src);
  const ws = fs.createWriteStream(dest);
  try {
    // pipeline автоматически закрывает оба потока и пробрасывает ошибки
    await pipeline(rs, ws);
    console.log(`✓ Скопировано (streams): ${src} → ${dest}`);
  } catch (err) {
    throw new Error(`Ошибка копирования через потоки: ${err.message}`);
  }
}

async function main() {
  try {
    console.log('Создаём большой файл (5 МБ)...');
    await createBigFile(5 * 1024 * 1024);

    const stats = await fsp.stat(BIG_FILE);
    console.log(`Размер исходного файла: ${(stats.size / 1024 / 1024).toFixed(2)} МБ`);

    // Требование: для файлов > 1 МБ используем потоки
    if (stats.size > 1024 * 1024) {
      await copyWithStreams(BIG_FILE, OUT_FILE);
    }

    const outStats = await fsp.stat(OUT_FILE);
    console.log(`Размер копии: ${(outStats.size / 1024 / 1024).toFixed(2)} МБ`);
  } catch (err) {
    console.error('Ошибка:', err.message);
  }
}

main();