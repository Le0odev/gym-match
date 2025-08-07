import { MigrationInterface, QueryRunner } from "typeorm";

export class ProfilePicColumn1754581959559 implements MigrationInterface {
    name = 'ProfilePicColumn1754581959559'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" ADD "profile_picture" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "profile_picture"`);
    }
}
