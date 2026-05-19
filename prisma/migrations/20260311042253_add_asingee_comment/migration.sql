-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignees" JSONB NOT NULL DEFAULT '[]',
ADD COLUMN     "comment" TEXT;
