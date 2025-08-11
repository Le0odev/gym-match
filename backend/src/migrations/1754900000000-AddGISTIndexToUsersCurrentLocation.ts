import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGISTIndexToUsersCurrentLocation1754900000000 implements MigrationInterface {
  name = 'AddGISTIndexToUsersCurrentLocation1754900000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS idx_users_current_location_gist ON users USING GIST ("currentLocation");`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS idx_users_current_location_gist;`
    );
  }
}


