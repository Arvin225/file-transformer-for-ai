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

// Word转Markdown处理
app.post('/convert', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  const inputPath = req.file.path;
  const outputDir = path.join('output', Date.now().toString());
  const imagesDir = path.join(outputDir, 'images');

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // 收集图片写入Promise
    const imageBuffers = [];
    
    const result = await mammoth.convertToHtml(
      { path: inputPath },
      {
        convertImage: mammoth.images.imgElement((image) => {
          const ext = image.contentType.split('/')[1] || 'png';
          const imageName = `image-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`;
          const imagePath = path.join(imagesDir, imageName);
          const relPath = `images/${imageName}`;
          
          imageBuffers.push(
            image.read().then(buffer => {
              fs.writeFileSync(imagePath, buffer);
            }).catch(err => {
              console.error('图片写入失败:', err);
            })
          );
          
          return { src: relPath };
        })
      }
    );

    // 等待所有图片写入完成
    await Promise.all(imageBuffers);

    // HTML转Markdown
    const markdown = turndownService.turndown(result.value);

    const mdFileName = req.file.originalname.replace(/\.docx?$/i, '.md');
    const mdFilePath = path.join(outputDir, mdFileName);
    fs.writeFileSync(mdFilePath, markdown);

    // 使用JSZip打包（更好的中文文件名支持）
    const zipPath = path.join(outputDir, 'converted.zip');
    const zip = new JSZip();
    
    // 添加Markdown文件
    zip.file(mdFileName, fs.readFileSync(mdFilePath));
    
    // 添加图片
    const imageFiles = fs.readdirSync(imagesDir);
    if (imageFiles.length > 0) {
      const imgFolder = zip.folder('images');
      imageFiles.forEach(file => {
        const filePath = path.join(imagesDir, file);
        imgFolder.file(file, fs.readFileSync(filePath));
      });
    }
    
    // 生成zip文件
    const zipBuffer = await zip.generateAsync({ 
      type: 'nodebuffer',
      compression: 'DEFLATE',
      compressionOptions: { level: 9 }
    });
    
    fs.writeFileSync(zipPath, zipBuffer);
    
    res.download(zipPath, 'converted.zip', (err) => {
      if (err) {
        console.error('下载错误:', err);
      }
      // 清理临时文件
      setTimeout(() => {
        fs.rmSync(inputPath, { force: true });
        fs.rmSync(outputDir, { recursive: true, force: true });
      }, 60000);
    });

  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: '转换失败: ' + error.message });
    fs.rmSync(inputPath, { force: true });
  }
});

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
