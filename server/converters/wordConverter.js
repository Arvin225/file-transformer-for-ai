const mammoth = require('mammoth');
const TurndownService = require('turndown');
const fs = require('fs');
const path = require('path');

const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

async function convertWordToFormat(inputPath, outputDir, imagesDir, format, originalName) {
  const imageMap = new Map();
  const imageBuffers = [];
  
  const result = await mammoth.convertToHtml(
    { path: inputPath },
    {
      convertImage: mammoth.images.imgElement((image) => {
        const ext = image.contentType.split('/')[1] || 'png';
        const imageName = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
        
        imageBuffers.push(
          image.read().then(buffer => {
            imageMap.set(imageName, { buffer, mimeType: image.contentType });
          }).catch(err => console.error('图片读取失败:', err))
        );
        
        return { src: `images/${imageName}` };
      })
    }
  );

  await Promise.all(imageBuffers);

  if (format === 'word-html') {
    let htmlContent = result.value;
    for (const [imageName, { buffer, mimeType }] of imageMap) {
      const base64 = buffer.toString('base64');
      const dataUri = `data:${mimeType};base64,${base64}`;
      htmlContent = htmlContent.replace(`src="images/${imageName}"`, `src="${dataUri}"`);
    }
    
    const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${originalName.replace(/\.docx?$/i, '')}</title>
  <style>
    body { max-width: 800px; margin: 40px auto; padding: 20px; font-family: -apple-system, sans-serif; line-height: 1.6; }
    img { max-width: 100%; height: auto; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #ddd; padding: 8px; }
  </style>
</head>
<body>
${htmlContent}
</body>
</html>`;
    
    return { type: 'html', content: fullHtml, ext: '.html' };
  } else {
    for (const [imageName, { buffer }] of imageMap) {
      fs.writeFileSync(path.join(imagesDir, imageName), buffer);
    }
    const markdown = turndownService.turndown(result.value);
    return { type: 'zip', content: markdown, ext: '.md', imagesDir };
  }
}

module.exports = { convertWordToFormat };
