/*
  Warnings:

  - You are about to drop the column `sourceTaskId` on the `Task` table. All the data in the column will be lost.
  - You are about to drop the column `transferredToId` on the `Task` table. All the data in the column will be lost.
  - Added the required column `currentDepartmentId` to the `Task` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_sourceTaskId_fkey";

-- DropForeignKey
ALTER TABLE "Task" DROP CONSTRAINT "Task_transferredToId_fkey";

-- AlterTable
ALTER TABLE "Task" DROP COLUMN "sourceTaskId",
DROP COLUMN "transferredToId",
ADD COLUMN     "currentDepartmentId" INTEGER NOT NULL;
