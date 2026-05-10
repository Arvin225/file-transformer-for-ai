const fs = require('fs/promises');
const removeMd = require('remove-markdown');

async function convertMdToText(inputPath) {
  const markdown = await fs.readFile(inputPath, 'utf-8');
  const plainText = removeMd(markdown);
  return { type: 'txt', content: plainText, ext: '.txt' };
}

module.exports = { convertMdToText };
