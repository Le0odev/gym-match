import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMissingColumnsToWorkoutPreferences1703123456790 implements MigrationInterface {
  name = 'AddMissingColumnsToWorkoutPreferences1703123456790';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Adicionar coluna category
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "category" character varying`);
    
    // Adicionar coluna icon
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "icon" character varying`);
    
    // Adicionar coluna users_count
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "users_count" integer NOT NULL DEFAULT 0`);
    
    // Adicionar coluna is_popular
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "is_popular" boolean NOT NULL DEFAULT false`);
    
    // Adicionar colunas de timestamp se não existirem
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "created_at" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" ADD "updated_at" TIMESTAMP NOT NULL DEFAULT now()`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "updated_at"`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "created_at"`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "is_popular"`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "users_count"`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "icon"`);
    await queryRunner.query(`ALTER TABLE "workout_preferences" DROP COLUMN "category"`);
  }
}
