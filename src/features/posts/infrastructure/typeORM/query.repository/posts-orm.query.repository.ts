import {
  PostDBType,
  PostPaginationType,
  PostViewType,
} from './posts.types.query.repository';
import { QueryPostInputModel } from '../../../api/models/input/query-post.input.model';
import { variablesForReturn } from '../../../../../infrastructure/utils/functions/variables-for-return.function';
import { modifyPostIntoViewModel } from '../../../../../infrastructure/utils/functions/features/posts.functions.helpers';
import { Injectable } from '@nestjs/common';
import { QueryBlogsInputModel } from '../../../../blogs/api/models/input/queries-blog.input.model';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { AllLikeStatusEnum } from '../../../../../infrastructure/utils/enums/like-status.enums';
import { BlogsQueryRepository } from '../../../../blogs/infrastructure/SQL/query.repository/blogs.query.repository';
import { Posts } from '../../../domain/posts.entity';
import { PostsLikesInfo } from '../../../domain/posts-likes-info.entity';
import { UsersBanInfo } from '../../../../users/domain/users-ban-info.entity';
import { Blogs } from '../../../../blogs/domain/blogs.entity';
import { IconOfBlog } from '../../../../blogs/domain/icon-of-blog.entity';
import { IconOfPost } from '../../../domain/main-img-of-post.entity';
import { ConfigService } from '@nestjs/config';
import { BlogsOrmQueryRepository } from '../../../../blogs/infrastructure/typeORM/query.repository/blogs-orm.query.repository';

@Injectable()
export class PostsOrmQueryRepository {
  constructor(
    @InjectRepository(Posts)
    protected postsRepository: Repository<Posts>,
    @InjectRepository(PostsLikesInfo)
    protected postsLikesInfoRepository: Repository<PostsLikesInfo>,
    @InjectDataSource() protected dataSource: DataSource,
    protected blogsQueryRepository: BlogsOrmQueryRepository,
    protected configService: ConfigService,
  ) {}

  //SQL
  async getAllPostsOfBlog(
    blogId: string,
    query: QueryBlogsInputModel,
    userId: string | null,
  ): Promise<null | PostPaginationType> {
    const blog = await this.blogsQueryRepository.doesBlogExist(blogId);
    if (!blog) return null;

    const { pageNumber, pageSize, sortBy, sortDirection } =
      variablesForReturn(query);

    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select([
        'p."id"',
        'p."title"',
        'p."shortDescription"',
        'p."content"',
        'p."blogId"',
        'p."createdAt"',
        'b.name AS "blogName"',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from(Posts, 'p')
          .leftJoin('p.blog', 'b')
          .where('b.isBanned = false')
          .andWhere('b.id = :blogId', { blogId });
      }, 'count')
      .addSelect((qb) => this.likesCountBuilder(qb), 'likesCount')
      .addSelect((qb) => this.dislikesCountBuilder(qb), 'dislikesCount')
      .addSelect((qb) => this.myStatusBuilder(qb, userId), 'myStatus')
      .addSelect((qb) => this.newestLikesBuilder(qb), 'newestLikes')
      .addSelect((qb) => this.mainImgPostBuilder(qb), 'mainImages')
      .leftJoin('p.blog', 'b')
      .where('b.isBanned = false')
      .andWhere('b.id = :blogId', { blogId })
      .orderBy(sortBy === 'blogName' ? 'b.name' : `p.${sortBy}`, sortDirection)
      .limit(+pageSize)
      .offset((+pageNumber - 1) * +pageSize);

    const postsInfo = await result.getRawMany();

    return {
      pagesCount: Math.ceil((+postsInfo[0]?.count || 1) / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +postsInfo[0]?.count || 0,
      items: postsInfo.map((post) =>
        modifyPostIntoViewModel(post, this.configService),
      ),
    };
  }

  async getAllPosts(
    query: QueryPostInputModel,
    userId: string | null,
  ): Promise<PostPaginationType> {
    const { pageNumber, pageSize, sortBy, sortDirection } =
      variablesForReturn(query);

    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select([
        'p."id"',
        'p."title"',
        'p."shortDescription"',
        'p."content"',
        'p."blogId"',
        'p."createdAt"',
        'b.name AS "blogName"',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from(Posts, 'p')
          .leftJoin('p.blog', 'b')
          .where('b.isBanned = false');
      }, 'count')
      .addSelect((qb) => this.likesCountBuilder(qb), 'likesCount')
      .addSelect((qb) => this.dislikesCountBuilder(qb), 'dislikesCount')
      .addSelect((qb) => this.myStatusBuilder(qb, userId), 'myStatus')
      .addSelect((qb) => this.newestLikesBuilder(qb), 'newestLikes')
      .addSelect((qb) => this.mainImgPostBuilder(qb), 'mainImages')
      .leftJoin('p.blog', 'b')
      .where('b.isBanned = false')
      .orderBy(sortBy === 'blogName' ? 'b.name' : `p.${sortBy}`, sortDirection)
      .limit(+pageSize)
      .offset((+pageNumber - 1) * +pageSize);

    const postsInfo = await result.getRawMany();

    return {
      pagesCount: Math.ceil((+postsInfo[0]?.count || 1) / +pageSize),
      page: +pageNumber,
      pageSize: +pageSize,
      totalCount: +postsInfo[0]?.count || 0,
      items: postsInfo.map((post) =>
        modifyPostIntoViewModel(post, this.configService),
      ),
    };
  }

  async doesPostExist(postId: string): Promise<boolean> {
    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select()
      .leftJoin('p.blog', 'b')
      .where('p.id = :postId', { postId })
      .andWhere('b.isBanned = false')
      .getExists();

    return result;
  }

  async doesPostExistAtBlog(postId: string, blogId: string): Promise<boolean> {
    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select()
      .leftJoin('p.blog', 'b')
      .where('p.id = :postId', { postId })
      .andWhere('b.id = :blogId', { blogId })
      .andWhere('b.isBanned = false')
      .getExists();

    return result;
  }

  async getPostByIdView(
    postId: string,
    userId: string | null,
  ): Promise<null | PostViewType> {
    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select([
        'p."id"',
        'p."title"',
        'p."shortDescription"',
        'p."content"',
        'p."blogId"',
        'p."createdAt"',
        'b.name AS "blogName"',
      ])
      .addSelect((subQuery) => {
        return subQuery
          .select('COUNT(*)')
          .from(Posts, 'p')
          .leftJoin('p.blog', 'b')
          .where('b.isBanned = false');
      }, 'count')
      .addSelect((qb) => this.likesCountBuilder(qb), 'likesCount')
      .addSelect((qb) => this.dislikesCountBuilder(qb), 'dislikesCount')
      .addSelect((qb) => this.myStatusBuilder(qb, userId), 'myStatus')
      .addSelect((qb) => this.newestLikesBuilder(qb), 'newestLikes')
      .addSelect((qb) => this.mainImgPostBuilder(qb), 'mainImages')
      .leftJoin('p.blog', 'b')
      .where('b.isBanned = false')
      .andWhere('p.id = :postId', { postId });

    const postInfo = await result.getRawOne();
    console.log('Post by id:', postInfo);
    return postInfo
      ? modifyPostIntoViewModel(postInfo, this.configService)
      : null;
  }

  async getPostDBInfoById(postId: string): Promise<PostDBType | null> {
    const result = await this.postsRepository
      .createQueryBuilder('p')
      .select([
        'p."id"',
        'p."blogId"',
        'p."userId"',
        'p."title"',
        'p."shortDescription"',
        'p."content"',
        'p."createdAt"',
      ])
      .where('p.id = :postId', { postId })
      .getOne();

    return result
      ? { ...result, createdAt: result.createdAt.toISOString() }
      : null;
  }

  private likesCountBuilder(qb: SelectQueryBuilder<any>) {
    return qb
      .select('COUNT(*)')
      .from(PostsLikesInfo, 'li')
      .leftJoin(UsersBanInfo, 'bi', 'li.userId = bi.userId')
      .where('li."likeStatus" = :like', { like: AllLikeStatusEnum.Like })
      .andWhere('li."postId" = p."id"')
      .andWhere('bi."isBanned" = false');
  }

  private dislikesCountBuilder(qb: SelectQueryBuilder<any>) {
    return qb
      .select('COUNT(*)')
      .from(PostsLikesInfo, 'li')
      .leftJoin(UsersBanInfo, 'bi', 'li.userId = bi.userId')
      .where('li."likeStatus" = :dislike', {
        dislike: AllLikeStatusEnum.Dislike,
      })
      .andWhere('li."postId" = p."id"')
      .andWhere('bi."isBanned" = false');
  }

  private myStatusBuilder(qb: SelectQueryBuilder<any>, userId) {
    return qb
      .select('li.likeStatus')
      .from(PostsLikesInfo, 'li')
      .leftJoin(UsersBanInfo, 'bi', 'li.userId = bi.userId')
      .where('li."userId" = :userId', { userId })
      .andWhere('li."postId" = p."id"')
      .andWhere('bi."isBanned" = false');
  }

  private newestLikesBuilder(qb: SelectQueryBuilder<any>) {
    return qb
      .select('json_agg(to_jsonb("threeLikes")) as "newestLikes"')
      .from((qb) => {
        return qb
          .select([
            'li."addedAt" AS "addedAt"',
            'li."userId" AS "userId"',
            'u."login" AS login',
          ])
          .from(PostsLikesInfo, 'li')
          .leftJoin('li.user', 'u')
          .leftJoin('u.userBanInfo', 'bi')
          .where('li."postId" = p."id"')
          .andWhere('li."likeStatus" = :like', {
            like: AllLikeStatusEnum.Like,
          })
          .andWhere('bi."isBanned" = false')
          .orderBy('li."addedAt"', 'DESC')
          .limit(3);
      }, 'threeLikes');
  }

  private mainImgPostBuilder(qb: SelectQueryBuilder<Posts>) {
    return qb.select('json_agg(to_jsonb("images"))').from((qb) => {
      return qb
        .select(['i."url"', 'i."width"', 'i."height"', 'i."fileSize"'])
        .from(IconOfPost, 'i')
        .where('i."postId" = p."id"');
    }, 'images');
  }
}
