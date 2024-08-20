English | [简体中文](/README.zh-CN.md)
# PURE-ADMIN-BACKEND

**Pure Admin Backend** is a backend service designed for quickly building an admin management system. It is developed using **NestJS**, **Prisma**, **Redis**, **PostgreSQL**, and **Minio**, offering the following features:

- User management
- Role management
- Permission management
- File upload

The corresponding frontend project is [pure-admin](https://github.com/wansongtao/pure-admin).

## Quick Start

### Prerequisites

Ensure that you have the following installed:

- [Node.js](https://nodejs.org/en/) (>=18.0.0)
- [Redis](https://redis.io/) (>=6.0.0)
- [PostgreSQL](https://www.postgresql.org/) (>=13.0)
- [Minio](https://min.io/) (>=2021.6.0)
- [NestJS](https://nestjs.com/) (>=10.0.0)
- [Prisma](https://www.prisma.io/) (>=3.0.0)
- [Jwt Key](#jwt-key) Generate your JWT key file.

Update the `.env` file with your own configuration:  

Example:
```bash
# Database configuration
DB_USER="wansongtao"
DB_PASSWORD="st.postgre"
# The service name in docker-compose.yml. If you use a local database, you can use localhost.
DB_HOST="postgres"
DB_PORT=5432
DB_NAME="auth_admin"
DATABASE_URL="postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"
```

If you have Docker installed, you can use the following command to start the development environment:

```bash
$ docker-compose --env-file .env.development up --build
```

### Clone the project

```bash
$ git clone https://github.com/wansongtao/pure-admin-backend.git
```

### Installation

```bash
$ pnpm install
```

### Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Jwt Key

### create private key

```bash
openssl genpkey -algorithm RSA -out private_key.pem -pkeyopt rsa_keygen_bits:2048
```

### create public key

```bash
openssl rsa -pubout -in private_key.pem -out public_key.pem
```

## License

[MIT licensed](LICENSE).

