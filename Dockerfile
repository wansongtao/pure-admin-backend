###################
# BUILD
###################
FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY --chown=node:node package.json .

# 安装依赖
RUN npm install

# 复制其余文件
COPY --chown=node:node . .

RUN npm run prisma:generate

RUN npm run build

USER node

###################
# PRODUCTION
###################
FROM node:18-alpine As production

RUN apk add --no-cache libc6-compat

WORKDIR /usr/src/app

# 创建日志目录
RUN mkdir -p logs && chown -R node:node logs

# 从 build 阶段复制必要文件
COPY --chown=node:node package*.json ./
COPY --chown=node:node .env.production.local ./
COPY --chown=node:node prisma ./prisma
COPY --chown=node:node key ./key
COPY --chown=node:node --from=build /usr/src/app/dist ./dist

RUN npm install --production
RUN npm install dotenv-cli prisma-docs-generator
RUN npm run prisma:generate

# 确保所有文件权限正确
RUN chown -R node:node .

USER node

CMD ["node", "/usr/src/app/dist/main.js"]