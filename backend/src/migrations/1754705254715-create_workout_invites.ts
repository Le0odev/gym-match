import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWorkoutInvites1754705254715 implements MigrationInterface {
    name = 'CreateWorkoutInvites1754705254715'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."workout_invites_workouttype_enum" AS ENUM('musculacao', 'cardio', 'funcional', 'hit', 'cross', 'outro')`);
        await queryRunner.query(`CREATE TYPE "public"."workout_invites_status_enum" AS ENUM('pending', 'accepted', 'rejected', 'canceled')`);
        await queryRunner.query(`CREATE TABLE "workout_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "match_id" character varying NOT NULL, "inviter_id" character varying NOT NULL, "invitee_id" character varying NOT NULL, "workoutType" "public"."workout_invites_workouttype_enum" NOT NULL, "date" date NOT NULL, "time" character varying(5) NOT NULL, "gym_id" character varying, "address" text, "latitude" double precision, "longitude" double precision, "status" "public"."workout_invites_status_enum" NOT NULL DEFAULT 'pending', "created_at" TIMESTAMP NOT NULL DEFAULT now(), "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "matchId" uuid, "inviterId" uuid, "inviteeId" uuid, CONSTRAINT "PK_2d6b6c3aa1270dab6243dae6ccb" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ADD CONSTRAINT "FK_3422203b7f3f6cdbe2891278155" FOREIGN KEY ("matchId") REFERENCES "matches"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ADD CONSTRAINT "FK_5e2e85bb9493a3b01d620caa458" FOREIGN KEY ("inviterId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workout_invites" ADD CONSTRAINT "FK_a905e93c36a5cad91d97e53f8c0" FOREIGN KEY ("inviteeId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workout_invites" DROP CONSTRAINT "FK_a905e93c36a5cad91d97e53f8c0"`);
        await queryRunner.query(`ALTER TABLE "workout_invites" DROP CONSTRAINT "FK_5e2e85bb9493a3b01d620caa458"`);
        await queryRunner.query(`ALTER TABLE "workout_invites" DROP CONSTRAINT "FK_3422203b7f3f6cdbe2891278155"`);
        await queryRunner.query(`DROP TABLE "workout_invites"`);
        await queryRunner.query(`DROP TYPE "public"."workout_invites_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."workout_invites_workouttype_enum"`);
    }

}
