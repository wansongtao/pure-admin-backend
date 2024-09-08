简体中文 | [English](./README.md)
# PURE-ADMIN-BACKEND

**Pure Admin Backend** 是一个用于快速构建后台管理系统的后端服务。基于 **NestJS**、**Prisma**、**Redis**、**PostgreSQL**和**Minio** 开发。提供以下功能：

- 用户管理
- 角色管理
- 权限管理
- 文件上传

配套的前端项目是[pure-admin](https://github.com/wansongtao/pure-admin)。

## 快速开始

### 先决条件

确保已安装以下软件：

- [Node.js](https://nodejs.org/en/) (>=18.0.0)
- [Redis](https://redis.io/) (>=6.0.0)
- [PostgreSQL](https://www.postgresql.org/) (>=13.0)
- [Minio](https://min.io/) (>=2021.6.0)
- [NestJS](https://nestjs.com/) (>=10.0.0)
- [Prisma](https://www.prisma.io/) (>=3.0.0)
- [Jwt Key](#jwt-key) 生成jwt密钥文件。

更新 `.env` 文件中的配置。

示例：
```bash
# 如果你使用docker-compose.yml启动开发环境，可以使用以下配置
DB_USER="wansongtao"
DB_PASSWORD="st.postgre"
DB_HOST="postgres" # docker-compose.yml中的服务名，如果你使用本地数据库，可以使用localhost
DB_PORT=5432
DB_NAME="auth_admin"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
```

如果你安装了docker，可以使用以下命令启动开发环境：

```bash
# 先启动minio
$ docker-compose -f ./docker/docker-compose.minio.yml up -d

# 启动开发环境
$ docker-compose --env-file .env.development up --build
```

### 克隆项目

```bash
$ git clone https://github.com/wansongtao/pure-admin-backend.git
```

### 安装

```bash
$ pnpm install
```

### 运行应用

```bash
# 开发模式
$ pnpm run start

# 监视模式
$ pnpm run start:dev

# 生产模式
$ pnpm run start:prod
```

## Jwt Key

### 创建私钥

```bash
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
```

### 创建公钥

```bash
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

## 许可证

[MIT](./LICENSE)
