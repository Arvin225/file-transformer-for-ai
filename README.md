# 文件转换器

将 Word、Excel、CSV 等文档转换为 AI 友好的 Markdown 或 HTML 格式，保留文本、表格、格式和图片。

## 快速开始

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

打开浏览器访问 http://localhost:3000

## 功能特性

- **多格式输入**: 支持 Word (.docx/.doc)、Excel (.xlsx/.xls)、CSV (.csv)
- **多格式输出**: Markdown 和 HTML 两种格式
- **Word 转换**:
  - 标题层级 → Markdown # 语法 / HTML <h1>-<h6>
  - 文本格式 (加粗、斜体) → **粗体**、*斜体*
  - 有序/无序列表 → Markdown 列表
  - 表格 → Markdown 表格格式
  - 图片自动提取 (Markdown打包为.zip, HTML内嵌为Base64)
- **Excel/CSV 转换**: 表格数据 → Markdown 表格格式

## 技术栈

- Node.js + Express
- mammoth.js (Word 解析)
- xlsx (Excel 解析)
- csv-parser (CSV 解析)
- multer (文件上传)
- turndown (HTML 转 Markdown)
- turndown-plugin-gfm (GFM 表格支持)
- JSZip (zip 打包)

## 使用场景

适用于需要将各类文档导入 AI IDE (如 Windsurf、Cursor、GitHub Copilot) 的开发者。
