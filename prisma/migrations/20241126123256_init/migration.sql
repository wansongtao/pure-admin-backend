-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MA', 'FE', 'OT');

-- CreateEnum
CREATE TYPE "MenuType" AS ENUM ('DIRECTORY', 'MENU', 'BUTTON');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(100) NOT NULL,
    "user_name" VARCHAR(20) NOT NULL,
    "password" VARCHAR(100) NOT NULL,
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "profiles" (
    "id" SERIAL NOT NULL,
    "nick_name" VARCHAR(50),
    "avatar" VARCHAR(255),
    "email" VARCHAR(50),
    "phone" VARCHAR(20),
    "gender" "Gender" NOT NULL DEFAULT 'MA',
    "birthday" TIMESTAMP(3),
    "description" VARCHAR(150),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SMALLSERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(150),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_in_user" (
    "role_id" INTEGER NOT NULL,
    "user_id" TEXT NOT NULL,

    CONSTRAINT "role_in_user_pkey" PRIMARY KEY ("role_id","user_id")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id" SMALLSERIAL NOT NULL,
    "type" "MenuType" NOT NULL DEFAULT 'MENU',
    "name" VARCHAR(50) NOT NULL,
    "permission" VARCHAR(50),
    "icon" VARCHAR(50),
    "path" VARCHAR(50),
    "component" VARCHAR(150),
    "sort" SMALLINT NOT NULL DEFAULT 0,
    "redirect" VARCHAR(100),
    "disabled" BOOLEAN NOT NULL DEFAULT false,
    "hidden" BOOLEAN NOT NULL DEFAULT false,
    "cache" BOOLEAN NOT NULL DEFAULT false,
    "props" BOOLEAN NOT NULL DEFAULT false,
    "deleted" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "pid" SMALLINT,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role_in_permission" (
    "permission_id" INTEGER NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "role_in_permission_pkey" PRIMARY KEY ("role_id","permission_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_user_name_key" ON "users"("user_name");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_email_key" ON "profiles"("email");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_phone_key" ON "profiles"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "profiles_user_id_key" ON "profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_name_key" ON "permissions"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_permission_key" ON "permissions"("permission");

-- AddForeignKey
ALTER TABLE "profiles" ADD CONSTRAINT "profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_in_user" ADD CONSTRAINT "role_in_user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_in_user" ADD CONSTRAINT "role_in_user_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "permissions" ADD CONSTRAINT "permissions_pid_fkey" FOREIGN KEY ("pid") REFERENCES "permissions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_in_permission" ADD CONSTRAINT "role_in_permission_permission_id_fkey" FOREIGN KEY ("permission_id") REFERENCES "permissions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_in_permission" ADD CONSTRAINT "role_in_permission_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
