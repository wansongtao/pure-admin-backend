简体中文 | [English](./README.md)
# PURE-ADMIN-BACKEND

**Pure Admin Backend** 是一个权限管理系统 Web 服务，使用 **RBAC0** 权限模型，支持接口级别的权限控制。

配套的前端项目是 [pure-admin](https://github.com/wansongtao/pure-admin)。

## 功能特性

- 登录：支持单点登录，采用双 token 刷新登录凭证；
- 用户管理：增删改查，支持关联多个角色，支持禁用用户；
- 角色管理：增删改查，支持关联多个权限，支持禁用角色；
- 权限管理：增删改查，支持接口级别的权限控制；
- 日志管理：使用 winston 记录日志。

## 技术栈

`NodeJS` `NestJS` `PostgreSQL` `Prisma` `Redis` `Minio` `Docker` `Winston` `Swagger`

## 快速开始

### 先决条件

1. 安装 NodeJS 18+；
2. 安装 Docker。

### 克隆项目

```bash
$ git clone https://github.com/wansongtao/pure-admin-backend.git
```

### 生成 Jwt Key

在项目根目录下，创建 `key` 文件夹，然后进入该目录创建以下密钥。

```bash
# 生成私钥
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# 生成公钥
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### 启动容器服务

使用 docker-compose 启动容器：

```bash
$ docker-compose --env-file .env.development up --build
```

### 设置 Minio

#### 设置 Minio 访问密钥

在浏览器中访问 `http://localhost:9001`，使用 `docker-compose.yml` 里设置的用户名和密码登录 Minio。

选中左边菜单栏的 `Access Keys`，然后点击右上角的 `Create access key`，创建一个新的访问密钥。

然后你可以选择将新的访问密钥填入 `.env.development` 文件中的 `MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY`，或者将 `.env.development` 文件中的 `MINIO_ACCESS_KEY` 和 `MINIO_SECRET_KEY` 复制到创建的访问密钥中。

#### 设置 Minio 存储桶

在浏览器中访问 `http://localhost:9001`，使用 `docker-compose.yml` 里设置的用户名和密码登录 Minio。

选中左边菜单栏的 `Buckets`，然后点击右边的 `avatar` 桶，进入桶后，选中 `Anonymous`，然后点击右上角的 `Add Access Rule`，在弹窗中的 `Prefix` 输入 `/`， `Access` 选择 `readonly` ，点击 `Save`即可。

### 安装依赖

```bash
$ pnpm install
```

### 本地开发

```bash
# 迁移数据库
$ pnpm run migrate:dev

# 执行数据库种子
$ pnpm run prisma:seed

# 启动开发模式
$ pnpm run start

# 启动监视模式（代码更新，自动重启服务）
$ pnpm run start:dev
```

## 许可证

[MIT](./LICENSE)
