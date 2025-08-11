import { MigrationInterface, QueryRunner } from "typeorm";

export class  AddCompletedToWorkoutInviteStatus1754830369889 implements MigrationInterface {
    name = ' AddCompletedToWorkoutInviteStatus1754830369889'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "public"."workout_invites_status_enum" RENAME TO "workout_invites_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."workout_invites_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'canceled', 'completed')`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" TYPE "public"."workout_invites_status_enum" USING "status"::"text"::"public"."workout_invites_status_enum"`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."workout_invites_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workout_invites_status_enum_old" AS ENUM('pending', 'accepted', 'rejected', 'canceled')`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" TYPE "public"."workout_invites_status_enum_old" USING "status"::"text"::"public"."workout_invites_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ALTER COLUMN "status" SET DEFAULT 'pending'`);
        await queryRunner.query(`DROP TYPE "public"."workout_invites_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."workout_invites_status_enum_old" RENAME TO "workout_invites_status_enum"`);
    }

}
