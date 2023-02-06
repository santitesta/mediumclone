import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedDb1675114030651 implements MigrationInterface {
  name = 'SeedDb1675114030651';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `INSERT INTO tags (name) VALUES ('dragons'), ('coffee'), ('nestjs')`,
    );

    await queryRunner.query(
      // Password is asdf
      `INSERT INTO users (username, email, password) VALUES ('santi', 'santi@mail.com', '$2b$10$3YaElqcr1TQasnTpzoC3IegskbnpVCiX.E2xH3xbB389ZnIwzlt16')`,
    );

    await queryRunner.query(
      `INSERT INTO articles (slug, title, description, body, "tagList", "authorId") VALUES ('first-article', 'First article', 'First article description', 'First article body', 'coffee,dragons', 1), ('second-article', 'Second article', 'Second article description', 'Second article body', 'coffee,dragons', 1)`,
    );
  }

  public async down(): Promise<void> {}
}
