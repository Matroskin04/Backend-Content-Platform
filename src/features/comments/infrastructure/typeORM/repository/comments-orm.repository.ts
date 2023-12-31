import { Injectable } from '@nestjs/common';
import { CommentDBType } from '../../../domain/comments.db.types';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Comments } from '../../../domain/comments.entity';

@Injectable()
export class CommentsOrmRepository {
  constructor(
    @InjectRepository(Comments)
    protected commentsRepository: Repository<Comments>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  //SQL

  async createComment(
    content: string,
    userId: string,
    postId: string,
  ): Promise<CommentDBType> {
    const result = await this.commentsRepository
      .createQueryBuilder()
      .insert()
      .values({ content, userId, postId })
      .returning(['id', 'content', 'userId', 'postId', 'createdAt'])
      .execute();

    return result.raw[0];
  }

  async updateComment(content: string, commentId: string): Promise<boolean> {
    const result = await this.commentsRepository
      .createQueryBuilder()
      .update()
      .set({ content })
      .where('id = :commentId', { commentId })
      .execute();

    return result.affected === 1;
  }

  async deleteComment(
    commentId: string,
    commentsRepository: Repository<Comments> = this.commentsRepository,
  ): Promise<boolean> {
    const result = await commentsRepository
      .createQueryBuilder()
      .delete()
      .where('id = :commentId', { commentId })
      .execute();

    return result.affected === 1;
  }
}
