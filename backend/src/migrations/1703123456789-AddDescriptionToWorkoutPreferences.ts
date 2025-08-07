import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddDescriptionToWorkoutPreferences1703123456789 implements MigrationInterface {
  name = 'AddDescriptionToWorkoutPreferences1703123456789';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "description" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "description"`);
  }
}
