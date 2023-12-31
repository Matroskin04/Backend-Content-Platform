import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { IconOfPost } from '../../../domain/main-img-of-post.entity';
import { BlogPhotoInfoType } from '../../../../blogs/infrastructure/typeORM/subrepositories/photos-for-blog.types.repository';
import { PostPhotoInfoType } from './photos-for-post.types.repository';

@Injectable()
export class PhotosForPostRepository {
  constructor(
    @InjectRepository(IconOfPost)
    protected iconOfPostRepo: Repository<IconOfPost>,
  ) {}

  async savePostIconsInfo(
    photoInfo: PostPhotoInfoType[],
    iconOfPostRepo: Repository<IconOfPost> = this.iconOfPostRepo,
  ): Promise<void> {
    await iconOfPostRepo.save(photoInfo);
    return;
  }
}
