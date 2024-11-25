###################
# BUILD
###################
FROM node:18-alpine As build

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma

# 安装依赖
RUN npm install

# 复制其余文件
COPY . .

RUN npm run prisma:generate && npm run build && npm prune --production

###################
# PRODUCTION
###################
FROM node:18-alpine As production

RUN apk add --no-cache libc6-compat && mkdir -p /usr/src/app/logs && chown -R node:node /usr/src/app

WORKDIR /usr/src/app

# 从 build 阶段复制必要文件
COPY --chown=node:node .env.production.local ./
COPY --chown=node:node key ./key
COPY --chown=node:node --from=build /usr/src/app/dist ./dist
COPY --chown=node:node --from=build /usr/src/app/node_modules ./node_modules
COPY --chown=node:node --from=build /usr/src/app/package*.json ./
COPY --chown=node:node prisma ./prisma

USER node

CMD ["node", "dist/main.js"]