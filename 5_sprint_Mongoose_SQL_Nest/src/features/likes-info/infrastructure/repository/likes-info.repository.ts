import { ObjectId } from 'mongodb';
import { Injectable } from '@nestjs/common';
import {
  CommentLikeInfoInstanceType,
  PostLikeInfoInstanceType,
} from './likes-info.types.repository';
import { InjectModel } from '@nestjs/mongoose';
import {
  CommentLikesInfo,
  PostLikesInfo,
} from '../../domain/likes-info.entity';
import {
  CommentLikesInfoModelType,
  PostLikesInfoModelType,
  PostsLikesInfoDBType,
} from '../../domain/likes-info.db.types';
import { Comment } from '../../../comments/domain/comments.entity';
import { CommentModelType } from '../../../comments/domain/comments.db.types';
import { Post } from '../../../posts/domain/posts.entity';
import { PostModelType } from '../../../posts/domain/posts.db.types';
import {
  LikeDislikeStatusEnum,
  AllLikeStatusEnum,
  LikeDislikeStatusType,
  AllLikeStatusType,
} from '../../../../infrastructure/utils/enums/like-status';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class LikesInfoRepository {
  constructor(
    @InjectDataSource() protected dataSource: DataSource,
    @InjectModel(Post.name)
    private PostModel: PostModelType,
    @InjectModel(Comment.name)
    private CommentModel: CommentModelType,
    @InjectModel(CommentLikesInfo.name)
    private CommentsLikesInfoModel: CommentLikesInfoModelType,
    @InjectModel(PostLikesInfo.name)
    private PostsLikesInfoModel: PostLikesInfoModelType,
  ) {}

  //SQL
  async createLikeInfoOfPost(
    userId: string,
    postId: string,
    likeStatus: LikeDislikeStatusType,
  ): Promise<void> {
    const result = await this.dataSource.query(
      `
    INSERT INTO public."posts_likes_info"(
        "userId", "postId", "likeStatus")
        VALUES ($1, $2, $3);`,
      [userId, postId, AllLikeStatusEnum[likeStatus]],
    );
    return;
  }

  async updatePostLikeInfo(
    userId: string,
    postId: string,
    likeStatus: AllLikeStatusType,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."posts_likes_info"
        SET "likeStatus" = $1 
            WHERE "userId" = $2 AND "postId" = $3;`,
      [AllLikeStatusEnum[likeStatus], userId, postId],
    );
    return result[1] === 1;
  }

  //MONGO
  async getCommentLikeInfoInstance(
    commentId: string,
    userId: string,
  ): Promise<CommentLikeInfoInstanceType | null> {
    const commentLikeInfo = await this.CommentsLikesInfoModel.findOne({
      commentId,
      userId,
    });

    if (!commentLikeInfo) return null;
    return commentLikeInfo;
  }

  async save(
    likeInfo: PostLikeInfoInstanceType | CommentLikeInfoInstanceType,
  ): Promise<void> {
    await likeInfo.save();

    return;
  }

  async incrementNumberOfLikesOfComment(
    commentId: string,
    incrementValue: 'Like' | 'Dislike',
  ): Promise<boolean> {
    if (incrementValue === 'Like') {
      const result = await this.CommentModel.updateOne(
        { _id: commentId },
        { $inc: { 'likesInfo.likesCount': 1 } },
      );
      return result.modifiedCount === 1;
    } else {
      const result = await this.CommentModel.updateOne(
        { _id: commentId },
        { $inc: { 'likesInfo.dislikesCount': 1 } },
      );
      return result.modifiedCount === 1;
    }
  }

  async decrementNumberOfLikesOfComment(
    commentId: string,
    decrementValue: 'Like' | 'Dislike',
  ): Promise<boolean> {
    if (decrementValue === 'Like') {
      const result = await this.CommentModel.updateOne(
        { _id: commentId },
        { $inc: { 'likesInfo.likesCount': -1 } },
      );
      return result.modifiedCount === 1;
    } else {
      const result = await this.CommentModel.updateOne(
        { _id: commentId },
        { $inc: { 'likesInfo.dislikesCount': -1 } },
      );
      return result.modifiedCount === 1;
    }
  }
  async deleteLikeInfoComment(
    userId: string,
    commentId: string,
  ): Promise<boolean> {
    const result = await this.CommentsLikesInfoModel.deleteOne({
      userId,
      commentId,
    });
    return result.deletedCount === 1;
  }
}
