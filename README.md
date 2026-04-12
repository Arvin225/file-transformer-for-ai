# Word 文档转换器

将 Word 文档(.docx/.doc)转换为 AI 友好的格式，支持 Markdown 和 HTML 两种输出，保留文本、格式和图片。

## 快速开始

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

打开浏览器访问 http://localhost:3000

## 功能特性

- **多格式输出**: 支持 Markdown 和 HTML 两种格式
- **标题转换**: Word 标题层级 → Markdown # 语法 / HTML <h1>-<h6>
- **文本格式**: 加粗、斜体、下划线 → **粗体**、*斜体* / <strong>、<em>
- **列表转换**: 有序/无序列表 → Markdown 列表 / HTML <ul>/<ol>
- **图片处理**:
  - Markdown: 提取为单独文件夹，打包为 .zip
  - HTML: 内嵌为 Base64，单个 .html 文件

## 技术栈

- Node.js + Express
- mammoth.js (Word 解析)
- multer (文件上传)
- turndown (HTML 转 Markdown)
- JSZip (zip 打包)

## 使用场景

适用于需要将 Word 文档材料导入 AI IDE (如 Windsurf、Cursor、GitHub Copilot) 的开发者。
