-- CreateEnum
CREATE TYPE "VisitStatus" AS ENUM ('ACTIVE', 'CLOSED');

-- CreateTable
CREATE TABLE "users" (
    "id_user" TEXT NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "fk_roleId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id_user")
);

-- CreateTable
CREATE TABLE "visitors" (
    "id_visitor" TEXT NOT NULL,
    "fullName" VARCHAR(150) NOT NULL,
    "email" VARCHAR(255),
    "phone" VARCHAR(20),
    "cpf" VARCHAR(14),
    "document" VARCHAR(20),
    "company" VARCHAR(150),
    "purpose" VARCHAR(255) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visitors_pkey" PRIMARY KEY ("id_visitor")
);

-- CreateTable
CREATE TABLE "visits" (
    "id_visit" TEXT NOT NULL,
    "fk_visitorId" TEXT NOT NULL,
    "checkinAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "checkoutAt" TIMESTAMP(3),
    "status" "VisitStatus" NOT NULL DEFAULT 'ACTIVE',
    "host" VARCHAR(150) NOT NULL,
    "notes" VARCHAR(500),
    "createdBy" TEXT NOT NULL,
    "checkoutBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "visits_pkey" PRIMARY KEY ("id_visit")
);

-- CreateTable
CREATE TABLE "roles" (
    "id_role" SERIAL NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id_role")
);

-- CreateTable
CREATE TABLE "permissions" (
    "id_permission" SERIAL NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "description" VARCHAR(255),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "permissions_pkey" PRIMARY KEY ("id_permission")
);

-- CreateTable
CREATE TABLE "role_permissions" (
    "fk_roleId" INTEGER NOT NULL,
    "fk_permissionId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("fk_roleId","fk_permissionId")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_fk_roleId_idx" ON "users"("fk_roleId");

-- CreateIndex
CREATE INDEX "visits_fk_visitorId_idx" ON "visits"("fk_visitorId");

-- CreateIndex
CREATE INDEX "visits_status_idx" ON "visits"("status");

-- CreateIndex
CREATE INDEX "visits_createdAt_idx" ON "visits"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "roles_name_key" ON "roles"("name");

-- CreateIndex
CREATE UNIQUE INDEX "permissions_code_key" ON "permissions"("code");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_fk_roleId_fkey" FOREIGN KEY ("fk_roleId") REFERENCES "roles"("id_role") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_fk_visitorId_fkey" FOREIGN KEY ("fk_visitorId") REFERENCES "visitors"("id_visitor") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "users"("id_user") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "visits" ADD CONSTRAINT "visits_checkoutBy_fkey" FOREIGN KEY ("checkoutBy") REFERENCES "users"("id_user") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_fk_roleId_fkey" FOREIGN KEY ("fk_roleId") REFERENCES "roles"("id_role") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "role_permissions" ADD CONSTRAINT "role_permissions_fk_permissionId_fkey" FOREIGN KEY ("fk_permissionId") REFERENCES "permissions"("id_permission") ON DELETE CASCADE ON UPDATE CASCADE;
