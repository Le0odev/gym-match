import { MigrationInterface, QueryRunner } from 'typeorm';

export class ConvertTimestampsToTimestamptz1754905000000 implements MigrationInterface {
  name = 'ConvertTimestampsToTimestamptz1754905000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // messages: created_at, updated_at, read_at, delivered_at, edited_at
    await queryRunner.query(
      `ALTER TABLE messages
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC',
        ALTER COLUMN read_at TYPE timestamptz USING read_at AT TIME ZONE 'UTC',
        ALTER COLUMN delivered_at TYPE timestamptz USING delivered_at AT TIME ZONE 'UTC',
        ALTER COLUMN edited_at TYPE timestamptz USING edited_at AT TIME ZONE 'UTC';`
    );

    // matches: last_message_at, unmatched_at, created_at, updated_at
    await queryRunner.query(
      `ALTER TABLE matches
        ALTER COLUMN last_message_at TYPE timestamptz USING last_message_at AT TIME ZONE 'UTC',
        ALTER COLUMN unmatched_at TYPE timestamptz USING unmatched_at AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';`
    );

    // notifications: read_at, sent_at, created_at, updated_at
    await queryRunner.query(
      `ALTER TABLE notifications
        ALTER COLUMN read_at TYPE timestamptz USING read_at AT TIME ZONE 'UTC',
        ALTER COLUMN sent_at TYPE timestamptz USING sent_at AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE timestamptz USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamptz USING updated_at AT TIME ZONE 'UTC';`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverter para timestamp sem timezone
    await queryRunner.query(
      `ALTER TABLE messages
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC',
        ALTER COLUMN read_at TYPE timestamp USING read_at AT TIME ZONE 'UTC',
        ALTER COLUMN delivered_at TYPE timestamp USING delivered_at AT TIME ZONE 'UTC',
        ALTER COLUMN edited_at TYPE timestamp USING edited_at AT TIME ZONE 'UTC';`
    );

    await queryRunner.query(
      `ALTER TABLE matches
        ALTER COLUMN last_message_at TYPE timestamp USING last_message_at AT TIME ZONE 'UTC',
        ALTER COLUMN unmatched_at TYPE timestamp USING unmatched_at AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';`
    );

    await queryRunner.query(
      `ALTER TABLE notifications
        ALTER COLUMN read_at TYPE timestamp USING read_at AT TIME ZONE 'UTC',
        ALTER COLUMN sent_at TYPE timestamp USING sent_at AT TIME ZONE 'UTC',
        ALTER COLUMN created_at TYPE timestamp USING created_at AT TIME ZONE 'UTC',
        ALTER COLUMN updated_at TYPE timestamp USING updated_at AT TIME ZONE 'UTC';`
    );
  }
}


