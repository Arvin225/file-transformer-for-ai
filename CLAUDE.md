# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project overview

file-transformer-for-ai is a web app that converts Word (.docx/.doc), Excel (.xlsx/.xls), and CSV files into AI-friendly formats (Markdown or HTML). Users upload files via a browser UI, the server converts them, and the result is downloaded as a file attachment.

- **Stack**: Node.js + Express 5, no TypeScript, no frontend framework (vanilla JS)
- **No build step**, no bundler, no linter, no test framework

## Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install production dependencies |
| `npm start` | Start the server on port 3000 (`node server/index.js`) |
| `npm test` | Placeholder — always exits 1 (no tests exist) |

## Architecture

```
POST /convert  (multipart: file + format)
        │
        ▼
server/routes/convert.js   ← dispatches by format string
        │
        ├── word-md   → wordConverter  → mammoth → turndown → jszip → .zip
        ├── word-html → wordConverter  → mammoth → standalone .html
        ├── excel-md  → excelConverter → xlsx → .md (one table per sheet)
        └── csv-md    → csvConverter   → csv-parser → .md (one table)
        │
        ▼
response: file download (Content-Disposition: attachment)
```

- **Client**: `client/index.html` + `client/app.js` + `client/style.css` — a single-page upload UI with drag-and-drop and format selection
- **Server**: Express 5 at `server/index.js`, listens on port 3000 (hardcoded, no env var)
- **Multer** stores uploads in `uploads/`, outputs go to `output/<timestamp>/`
- **Cleanup**: `server/utils/fileCleanup.js` deletes temp files after a 60-second delay

## Key design decisions

- **word-md** produces a `.zip` containing one `.md` file + an `images/` folder; **word-html** produces a standalone `.html` with Base64-inlined images
- Images in Word documents are extracted and saved to disk for Markdown, or inlined as Base64 data URIs for HTML
- `jszip` is used for ZIP creation; `archiver` is listed as a dependency but is unused in source code