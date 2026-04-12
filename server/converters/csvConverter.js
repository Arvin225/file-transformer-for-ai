const fs = require('fs');
const csv = require('csv-parser');

async function convertCsvToMarkdown(inputPath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(inputPath)
      .pipe(csv())
      .on('data', (data) => rows.push(data))
      .on('end', () => {
        if (rows.length === 0) {
          resolve('');
          return;
        }
        
        const headers = Object.keys(rows[0]);
        let markdown = '| ' + headers.join(' | ') + ' |\n';
        markdown += '|' + headers.map(() => ' --- ').join('|') + '|\n';
        
        rows.forEach(row => {
          const cells = headers.map(h => row[h] || '');
          markdown += '| ' + cells.join(' | ') + ' |\n';
        });
        
        resolve(markdown);
      })
      .on('error', reject);
  });
}

module.exports = { convertCsvToMarkdown };
