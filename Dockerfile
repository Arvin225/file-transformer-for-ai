FROM node:18-alpine

WORKDIR /app

# 先复制 package.json 以利用 Docker 缓存层
COPY package*.json ./

# 安装依赖
RUN npm ci --only=production

# 创建上传和输出目录
RUN mkdir -p /app/uploads /app/output

# 复制所有源代码
COPY . .

# 暴露端口（与 server/index.js 中的 PORT 一致）
EXPOSE 3000

# 设置环境变量
ENV NODE_ENV=production

# 启动命令（使用 package.json 中的 start 脚本）
CMD ["npm", "start"]
