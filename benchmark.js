const fs = require('fs');
const path = require('path');

const dir = './benchmark-data';
if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

const ITERATIONS = 100;

function runSync() {
  console.time('1. Синхронно (Sync)');
  for (let i = 0; i < ITERATIONS; i++) {
    const file = path.join(dir, `sync_${i}.txt`);
    fs.writeFileSync(file, 'test data');
    fs.readFileSync(file, 'utf8');
    fs.unlinkSync(file);
  }
  console.timeEnd('1. Синхронно (Sync)');
}

function runCallbacks(done) {
  console.time('2. Колбэки (Callbacks)');
  let completed = 0;
  for (let i = 0; i < ITERATIONS; i++) {
    const file = path.join(dir, `cb_${i}.txt`);
    fs.writeFile(file, 'test data', () => {
      fs.readFile(file, 'utf8', () => {
        fs.unlink(file, () => {
          completed++;
          if (completed === ITERATIONS) {
            console.timeEnd('2. Колбэки (Callbacks)');
            done();
          }
        });
      });
    });
  }
}

async function runPromises() {
  console.time('3. Промисы (Promises)');
  const tasks = [];
  for (let i = 0; i < ITERATIONS; i++) {
    const file = path.join(dir, `prom_${i}.txt`);
    tasks.push(
      fs.promises.writeFile(file, 'test data')
        .then(() => fs.promises.readFile(file, 'utf8'))
        .then(() => fs.promises.unlink(file))
    );
  }
  await Promise.all(tasks);
  console.timeEnd('3. Промисы (Promises)');
}

runSync();
runCallbacks(async () => {
  await runPromises();
  fs.rmSync(dir, { recursive: true, force: true });
});
