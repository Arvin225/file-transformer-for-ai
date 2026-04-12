# Word 转 Markdown 转换器

将 Word 文档(.docx/.doc)转换为 AI 友好的 Markdown 格式，保留文本、格式和图片。

## 快速开始

```bash
# 安装依赖
npm install

# 启动服务器
npm start
```

打开浏览器访问 http://localhost:3000

## 功能特性

- **标题转换**: Word 标题层级 → Markdown # 语法
- **文本格式**: 加粗、斜体、下划线 → **粗体**、*斜体*
- **列表转换**: 有序/无序列表 → 1. / - 语法
- **图片提取**: 自动提取内嵌图片，打包下载
- **一键打包**: 转换结果为 .zip 文件（Markdown + images 文件夹）

## 技术栈

- Node.js + Express
- mammoth.js (Word解析)
- multer (文件上传)
- archiver (zip打包)

## 使用场景

适用于需要将 Word 文档材料导入 AI IDE (如 Windsurf、Cursor、GitHub Copilot) 的开发者。
