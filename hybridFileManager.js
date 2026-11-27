const fs = require('fs');
const path = require('path');

class HybridFileManager {
  constructor(baseDir = './data-hybrid') {
    this.baseDir = baseDir;
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
  }

  // Поддерживает и callback, и Promise (если callback не передан)
  createFile(filename, content, callback) {
    const filePath = path.join(this.baseDir, filename);
    const promise = fs.promises.writeFile(filePath, content, 'utf8').then(() => filePath);

    if (typeof callback === 'function') {
      promise.then(res => callback(null, res)).catch(err => callback(err, null));
      return;
    }
    return promise;
  }

  readFile(filename, callback) {
    const filePath = path.join(this.baseDir, filename);
    const promise = fs.promises.readFile(filePath, 'utf8');

    if (typeof callback === 'function') {
      promise.then(data => callback(null, data)).catch(err => callback(err, null));
      return;
    }
    return promise;
  }
}

module.exports = HybridFileManager;
