# admin-pure-server

## Description

这是一个基于Nest.js的后端服务，用于提供后台管理系统的`REST API`接口服务。主要功能包括：用户管理、角色管理、权限管理、菜单管理、日志管理等。

## Installation

```bash
$ pnpm install
```

## Running the app

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Test

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
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

基于 [MIT](./LICENSE) 许可协议进行开源。
