-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assignedToManagerId" INTEGER;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assignedToManagerId_fkey" FOREIGN KEY ("assignedToManagerId") REFERENCES "Manager"("id") ON DELETE SET NULL ON UPDATE CASCADE;
