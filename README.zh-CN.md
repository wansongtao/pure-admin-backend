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
# 先启动minio，然后登录控制台(http://localhost:9001)创建一个Access Key与Secret Key并替换.env文件中minio的配置
$ docker-compose -f ./docker/docker-compose.minio.yml up -d

# 启动开发环境(先将.env文件中的MINIO_ENDPOINT替换为你的内网IP地址)
$ docker-compose --env-file .env.development up --build
```

为什么`MINIO_ENDPOINT`需要替换为内网IP地址？因为`minio`服务是在`docker`中运行的，而`nestjs`服务也是在`docker`中运行的，如果使用`localhost`访问`minio`服务，会导致`minio`服务无法访问，因为在容器中`localhost`代表容器本身。而使用容器名访问`minio`服务，`nestjs`可以正常访问，但是前端无法访问，因为前端是在浏览器中运行的，无法解析容器名。所以需要使用内网IP地址。

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
