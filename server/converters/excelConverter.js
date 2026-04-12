const XLSX = require('xlsx');

async function convertExcelToMarkdown(inputPath) {
  const workbook = XLSX.readFile(inputPath);
  let markdown = '';
  
  workbook.SheetNames.forEach((sheetName, index) => {
    if (index > 0) markdown += '\n\n---\n\n';
    markdown += `## ${sheetName}\n\n`;
    
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    
    if (jsonData.length === 0) return;
    
    const headers = jsonData[0];
    markdown += '| ' + headers.join(' | ') + ' |\n';
    markdown += '|' + headers.map(() => ' --- ').join('|') + '|\n';
    
    for (let i = 1; i < jsonData.length; i++) {
      const row = jsonData[i];
      const cells = headers.map((_, colIndex) => row[colIndex] || '');
      markdown += '| ' + cells.join(' | ') + ' |\n';
    }
  });
  
  return markdown;
}

module.exports = { convertExcelToMarkdown };
