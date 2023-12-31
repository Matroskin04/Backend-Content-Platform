import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async createUser(
    userId: string,
    login: string,
    email: string,
    passwordHash: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
    INSERT INTO public.users( 
        "id", "login", "email", "passwordHash") 
        VALUES ($1, $2, $3, $4);
`,
      [userId, login, email, passwordHash],
    );
    return;
  }

  async createInfoBannedUserOfBlog(
    userId: string,
    blogId: string,
    banReason: string,
    banStatus: boolean,
  ): Promise<void> {
    const result = await this.dataSource.query(
      `
    INSERT INTO public."banned_users_of_blog"(
        "userId", "blogId", "isBanned", "banReason")
        VALUES ($1, $2, $3, $4);`,
      [userId, blogId, banStatus, banReason],
    );
    return;
  }

  async updatePassword(
    newPasswordHash: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."users"
      SET "passwordHash" = $1
      WHERE "id" = $2`,
      [newPasswordHash, userId],
    );
    return result[1] === 1;
  }

  async updateBanInfoOfUser(
    userId: string,
    isBanned: boolean,
    banReason: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."users_ban_info" 
      SET "isBanned" = $1, "banReason" = $2, "banDate" = CASE WHEN $1 = true THEN now() ELSE NULL END
      WHERE "userId" = $3`,
      [isBanned, isBanned ? banReason : null, userId],
    );
    return result[1] === 1;
  }

  async deleteUserById(userId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."users"
        SET "isDeleted" = true
        WHERE "id" = $1`,
      [userId],
    );
    return result[1] === 1;
  }

  async deleteInfoBannedUserOfBlog(
    userId: string,
    blogId: string,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    DELETE FROM public."banned_users_of_blog" 
        WHERE "userId" = $1 AND "blogId" = $2;`,
      [userId, blogId],
    );
    return result[1] === 1;
  }
}
