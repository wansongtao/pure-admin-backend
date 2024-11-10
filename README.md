English | [简体中文](/README.zh-CN.md)
# PURE-ADMIN-BACKEND

**Pure Admin Backend** is a permission management system web service that uses the **RBAC0** permission model and supports interface-level permission control.

The front-end project is [pure-admin](https://github.com/wansongtao/pure-admin).

## Features

- Login: Supports single sign-on and uses double token refresh login credentials;
- User management: Create, delete, update, and query users, support associating multiple roles, and support disabling users;
- Role management: Create, delete, update, and query roles, support associating multiple permissions, and support disabling roles;
- Permission management: Create, delete, update, and query permissions, support interface-level permission control;
- Log management: Use winston to log.

## Technology Stack

`NodeJS` `NestJS` `PostgreSQL` `Prisma` `Redis` `Minio` `Docker` `Winston` `Swagger`

## Quick Start

### Prerequisites

1. Install NodeJS 18+;
2. Install Docker.

### Clone the Project

```bash
$ git clone https://github.com/wansongtao/pure-admin-backend.git
```

### Generate Jwt Key

Create the `key` folder in the root directory of the project, then enter the directory to create the following keys.

```bash
# Generate private key
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048

# Generate public key
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

### Start the Container Service

Start the container using docker-compose:

```bash
$ docker-compose --env-file .env.development up --build
```

### Set Minio

#### Set Minio Access Key

Access `http://localhost:9001` in the browser, log in to Minio using the username and password set in `docker-compose.yml`.

Select `Access Keys` in the left menu bar, then click `Create access key` in the upper right corner to create a new access key.

You can then choose to fill the new access keys into the `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` fields in the `.env.development` file, or copy the `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` from the `.env.development` file to the created access keys.

#### Set Minio Bucket

Access `http://localhost:9001` in the browser, log in to Minio using the username and password set in `docker-compose.yml`.

Select `Buckets` in the left menu bar, then click the `avatar` bucket on the right. After entering the bucket, select `Anonymous`, then click `Add Access Rule` in the upper right corner. In the popup window, enter `/` in the `Prefix` field, select `readonly` for `Access`, and click `Save`.

### Install Dependencies

```bash
$ pnpm install
```

### Start the Service

```bash
# Migrate the database
$ pnpm run migrate:dev

# Seed the database
$ pnpm run prisma:seed

# Start the service
$ pnpm run start

# Start the development mode
$ pnpm run start:dev
```

## License

[MIT licensed](LICENSE).

