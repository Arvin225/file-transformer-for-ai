const express = require('express');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { upload } = require('../config/upload');
const { cleanup } = require('../utils/fileCleanup');
const { convertWordToFormat } = require('../converters/wordConverter');
const { convertExcelToMarkdown } = require('../converters/excelConverter');
const { convertCsvToMarkdown } = require('../converters/csvConverter');

const router = express.Router();

router.post('/', upload.single('file'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: '请上传文件' });
  }

  const format = req.body.format || 'word-md';
  const inputPath = req.file.path;
  const outputDir = path.join('output', Date.now().toString());
  const imagesDir = path.join(outputDir, 'images');

  try {
    fs.mkdirSync(outputDir, { recursive: true });
    
    let result;
    
    if (format.startsWith('word')) {
      fs.mkdirSync(imagesDir, { recursive: true });
      result = await convertWordToFormat(inputPath, outputDir, imagesDir, format, req.file.originalname);
    } else if (format === 'excel-md') {
      const markdown = await convertExcelToMarkdown(inputPath);
      result = { type: 'md', content: markdown, ext: '.md' };
    } else if (format === 'csv-md') {
      const markdown = await convertCsvToMarkdown(inputPath);
      result = { type: 'md', content: markdown, ext: '.md' };
    } else {
      throw new Error('不支持的格式');
    }

    const outputName = req.file.originalname.replace(/\.[^/.]+$/, result.ext);
    const outputPath = path.join(outputDir, outputName);

    if (result.type === 'zip') {
      fs.writeFileSync(outputPath, result.content);
      
      const zipPath = path.join(outputDir, 'converted.zip');
      const zip = new JSZip();
      zip.file(outputName, fs.readFileSync(outputPath));
      
      const imageFiles = fs.readdirSync(imagesDir);
      if (imageFiles.length > 0) {
        const imgFolder = zip.folder('images');
        imageFiles.forEach(file => {
          imgFolder.file(file, fs.readFileSync(path.join(imagesDir, file)));
        });
      }
      
      const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
      fs.writeFileSync(zipPath, zipBuffer);
      
      res.setHeader('Content-Disposition', `attachment; filename="converted.zip"`);
      res.download(zipPath, 'converted.zip', (err) => {
        if (err) console.error('下载错误:', err);
        setTimeout(() => cleanup(inputPath, outputDir), 60000);
      });
    } else {
      fs.writeFileSync(outputPath, result.content);
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(outputName)}"`);
      res.download(outputPath, outputName, (err) => {
        if (err) console.error('下载错误:', err);
        setTimeout(() => cleanup(inputPath, outputDir), 60000);
      });
    }

  } catch (error) {
    console.error('转换错误:', error);
    res.status(500).json({ error: '转换失败: ' + error.message });
    cleanup(inputPath, outputDir);
  }
});

module.exports = router;
