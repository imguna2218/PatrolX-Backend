/*
  Warnings:

  - You are about to drop the column `sequence_order` on the `AssignmentLocations` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "AssignmentLocations_assignment_id_sequence_order_key";

-- AlterTable
ALTER TABLE "AssignmentLocations" DROP COLUMN "sequence_order";

-- AlterTable
ALTER TABLE "Checkpoints" ADD COLUMN     "assignmentLocationsId" TEXT;

-- CreateTable
CREATE TABLE "_AssignmentCheckpoints" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_AssignmentCheckpoints_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_AssignmentCheckpoints_B_index" ON "_AssignmentCheckpoints"("B");

-- AddForeignKey
ALTER TABLE "_AssignmentCheckpoints" ADD CONSTRAINT "_AssignmentCheckpoints_A_fkey" FOREIGN KEY ("A") REFERENCES "AssignmentLocations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_AssignmentCheckpoints" ADD CONSTRAINT "_AssignmentCheckpoints_B_fkey" FOREIGN KEY ("B") REFERENCES "Checkpoints"("id") ON DELETE CASCADE ON UPDATE CASCADE;
