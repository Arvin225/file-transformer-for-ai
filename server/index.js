const express = require('express');
const path = require('path');
const convertRoute = require('./routes/convert');

const app = express();
const PORT = 3000;

// 静态资源（指向前端目录）
app.use(express.static(path.join(__dirname, '../client')));

// 路由
app.use('/convert', convertRoute);

app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
