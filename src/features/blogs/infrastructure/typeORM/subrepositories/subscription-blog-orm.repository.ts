import { Injectable } from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { SubscribersOfBlog } from '../../../domain/subscribers-of-blog.entity';
import { SubscriptionStatusEnum } from '../../../../../infrastructure/utils/enums/blogs-subscribers.enums';

@Injectable()
export class SubscriptionsBlogOrmRepository {
  constructor(
    @InjectRepository(SubscribersOfBlog)
    protected subscribersOfBlogRepository: Repository<SubscribersOfBlog>,
    @InjectDataSource() protected dataSource: DataSource,
  ) {}

  async subscribeToBlog(blogId: string, userId: string): Promise<void> {
    const result = await this.subscribersOfBlogRepository.insert({
      blogId,
      userId,
      subscriptionStatus: SubscriptionStatusEnum.Subscribed,
    });
    return;
  }

  async doesUserSubscribedToBlog(
    blogId: string,
    userId: string,
  ): Promise<boolean> {
    const result = await this.subscribersOfBlogRepository.exist({
      where: {
        blogId,
        userId,
        subscriptionStatus: SubscriptionStatusEnum.Subscribed,
      },
    });
    return result;
  }

  async unsubscribeFromBlog(blogId: string, userId: string): Promise<boolean> {
    const result = await this.subscribersOfBlogRepository.update(
      { blogId, userId },
      {
        subscriptionStatus: SubscriptionStatusEnum.Unsubscribed,
      },
    );
    return result.affected === 1;
  }
}
