const express = require('express');
const multer = require('multer');
const mammoth = require('mammoth');
const JSZip = require('jszip');
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');
const TurndownService = require('turndown');

const app = express();
const PORT = 3000;

// 初始化 turndown
const turndownService = new TurndownService({
  headingStyle: 'atx',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced'
});

// 配置文件上传
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

app.use(express.static('public'));

// Word转Markdown/HTML处理
app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  const format = req.body.format || 'markdown';
  const inputPath = req.file.path;
  const outputDir = path.join('output', Date.now().toString());
  const imagesDir = path.join(outputDir, 'images');

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // 收集图片
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
              imageMap.set(imageName, {
                buffer,
                mimeType: image.contentType
              });
            }).catch(err => {
              console.error('图片读取失败:', err);
            })
          );
          
          // HTML格式使用base64内嵌，Markdown使用相对路径
          if (format === 'html') {
            return { src: `images/${imageName}` };
          } else {
            return { src: `images/${imageName}` };
          }
        })
      }
    );

    // 等待所有图片读取完成
    await Promise.all(imageBuffers);

    if (format === 'html') {
      // HTML格式：将图片转为base64内嵌
      let htmlContent = result.value;
      
      for (const [imageName, { buffer, mimeType }] of imageMap) {
        const base64 = buffer.toString('base64');
        const dataUri = `data:${mimeType};base64,${base64}`;
        htmlContent = htmlContent.replace(`src="images/${imageName}"`, `src="${dataUri}"`);
      }
      
      // 包装为完整HTML文档
      const fullHtml = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${req.file.originalname.replace(/\.docx?$/i, '')}</title>
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

      const htmlFileName = req.file.originalname.replace(/\.docx?$/i, '.html');
      const htmlFilePath = path.join(outputDir, htmlFileName);
      fs.writeFileSync(htmlFilePath, fullHtml);
      
      res.download(htmlFilePath, htmlFileName, (err) => {
        if (err) console.error('下载错误:', err);
        setTimeout(() => {
          fs.rmSync(inputPath, { force: true });
          fs.rmSync(outputDir, { recursive: true, force: true });
        }, 60000);
      });
    } else {
      // Markdown格式：保存图片到目录，使用相对路径
      for (const [imageName, { buffer }] of imageMap) {
        const imagePath = path.join(imagesDir, imageName);
        fs.writeFileSync(imagePath, buffer);
      }
      
      const markdown = turndownService.turndown(result.value);
      const mdFileName = req.file.originalname.replace(/\.docx?$/i, '.md');
      const mdFilePath = path.join(outputDir, mdFileName);
      fs.writeFileSync(mdFilePath, markdown);

      // 使用JSZip打包
      const zipPath = path.join(outputDir, 'converted.zip');
      const zip = new JSZip();
      
      zip.file(mdFileName, fs.readFileSync(mdFilePath));
      
      const imageFiles = fs.readdirSync(imagesDir);
      if (imageFiles.length > 0) {
        const imgFolder = zip.folder('images');
        imageFiles.forEach(file => {
          const filePath = path.join(imagesDir, file);
          imgFolder.file(file, fs.readFileSync(filePath));
        });
      }
      
      const zipBuffer = await zip.generateAsync({ 
        type: 'nodebuffer',
        compression: 'DEFLATE',
        compressionOptions: { level: 9 }
      });
      
      fs.writeFileSync(zipPath, zipBuffer);
      
      res.download(zipPath, 'converted.zip', (err) => {
        if (err) console.error('下载错误:', err);
        setTimeout(() => {
          fs.rmSync(inputPath, { force: true });
          fs.rmSync(outputDir, { recursive: true, force: true });
        }, 60000);
      });
    }

  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: '转换失败: ' + error.message });
    fs.rmSync(inputPath, { force: true });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
