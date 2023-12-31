import {
  QueryBlogsInputModel,
  QueryCommentsOfBlogInputModel,
  QueryPostsOfBlogInputModel,
} from './models/input/queries-blog.input.model';
import {
  BlogOutputModel,
  BlogsOutputModel,
  PostsOfBlogViewModel,
} from './models/output/blog.output.models';
import { CreateBlogInputModel } from './models/input/create-blog.input.model';
import { UpdateBlogInputModel } from './models/input/update-blog.input.model';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  ParseFilePipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseGuards,
  UseInterceptors,
  UsePipes,
} from '@nestjs/common';
import { JwtAccessGuard } from '../../../infrastructure/guards/authorization-guards/jwt-access.guard';
import { HTTP_STATUS_CODE } from '../../../infrastructure/utils/enums/http-status.enums';
import { CurrentUserId } from '../../../infrastructure/decorators/current-user-id.param.decorator';
import { CreatePostByBlogIdModel } from '../../posts/api/models/input/create-post.input.model';
import { PostTypeWithId } from '../../posts/infrastructure/SQL/repository/posts.types.repositories';
import { BlogOwnerByIdGuard } from '../../../infrastructure/guards/forbidden-guards/blog-owner-by-id.guard';
import { UpdatePostByBlogIdInputModel } from './models/input/update-post-by-blog-id.input.model';
import { CommandBus } from '@nestjs/cqrs';
import { CreateBlogCommand } from '../application/blogger/use-cases/create-blog.use-case';
import { UpdateBlogCommand } from '../application/blogger/use-cases/update-blog.use-case';
import { DeleteBlogCommand } from '../application/blogger/use-cases/delete-blog.use-case';
import { CreatePostCommand } from '../../posts/application/use-cases/create-post.use-case';
import { UpdatePostCommand } from '../../posts/application/use-cases/update-post.use-case';
import { DeletePostCommand } from '../../posts/application/use-cases/delete-post.use-case';
import { CommentsOrmQueryRepository } from '../../comments/infrastructure/typeORM/query.repository/comments-orm.query.repository';
import { PostsOrmQueryRepository } from '../../posts/infrastructure/typeORM/query.repository/posts-orm.query.repository';
import { BlogsOrmQueryRepository } from '../infrastructure/typeORM/query.repository/blogs-orm.query.repository';
import { FileInterceptor } from '@nestjs/platform-express';
import { WidthHeightFileValidator } from '../../../infrastructure/validators/width-height-file.validator';
import { UploadBlogIconCommand } from '../application/blogger/use-cases/upload-blog-icon.use-case';
import { ImageFileValidator } from '../../../infrastructure/validators/type-file.validator';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '../../../configuration/configuration';
import { BlogPhotosOutputModel } from './models/output/blog-photos.output.model';
import { UploadBlogWallpaperCommand } from '../application/blogger/use-cases/upload-blog-wallpaper.use-case';
import { UploadPostMainImgCommand } from '../../posts/application/use-cases/upload-post-main-img.use-case';
import { MaxFileSizeValidator } from '../../../infrastructure/validators/max-file-size.validator';
import { IsIdUUIDValidationPipe } from '../../../infrastructure/pipes/is-id-uuid-validation.pipe';

@Controller('/api/blogger/blogs')
export class BlogsBloggerController {
  constructor(
    protected commandBus: CommandBus,
    protected blogsOrmQueryRepository: BlogsOrmQueryRepository,
    protected postsOrmQueryRepository: PostsOrmQueryRepository,
    protected commentsOrmQueryRepository: CommentsOrmQueryRepository,
    protected configService: ConfigService<ConfigType>,
  ) {}

  @UseGuards(JwtAccessGuard)
  @Get()
  async getAllBlogs(
    @Query() query: QueryBlogsInputModel,
    @CurrentUserId() userId: string,
  ): Promise<BlogsOutputModel> {
    const result = await this.blogsOrmQueryRepository.getAllBlogsOfBlogger(
      query,
      userId.toString(),
    );
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @Get(':blogId/posts')
  async getAllPostsOfBlog(
    @Param('blogId') blogId: string,
    @CurrentUserId() userId: string,
    @Query() query: QueryPostsOfBlogInputModel,
  ): Promise<PostsOfBlogViewModel> {
    const result = await this.postsOrmQueryRepository.getAllPostsOfBlog(
      blogId,
      query,
      userId,
    );
    if (!result) throw new NotFoundException();
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @Get('comments')
  async getCommentsOfBlogger(
    @CurrentUserId() userId: string,
    @Query() query: QueryCommentsOfBlogInputModel,
  ) {
    const result = await this.commentsOrmQueryRepository.getCommentsOfBlogger(
      query,
      userId,
    );
    return result;
  }

  @UseGuards(JwtAccessGuard)
  @HttpCode(HTTP_STATUS_CODE.CREATED_201)
  @Post()
  async createBlog(
    @Body() inputBlogModel: CreateBlogInputModel,
    @CurrentUserId() userId: string,
  ): Promise<BlogOutputModel> {
    const result = await this.commandBus.execute(
      new CreateBlogCommand(inputBlogModel, userId),
    );
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @Post(`/:blogId/posts`)
  async createPostByBlogId(
    @Param('blogId') blogId: string,
    @CurrentUserId() userId: string,
    @Body() inputPostModel: CreatePostByBlogIdModel,
  ): Promise<PostTypeWithId> {
    const result = await this.commandBus.execute(
      new CreatePostCommand(blogId, userId, inputPostModel),
    );
    if (!result) throw new NotFoundException();
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @HttpCode(HTTP_STATUS_CODE.NO_CONTENT_204)
  @Put(':blogId')
  async updateBlog(
    @Param('blogId') blogId: string,
    @Body() inputBlogModel: UpdateBlogInputModel,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdateBlogCommand(inputBlogModel, blogId),
    );
    if (!result) throw new NotFoundException();
    return;
  }

  //todo create correct format error in maxfilevalidtor
  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @Post(':blogId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBlogIcon(
    @Param('blogId', IsIdUUIDValidationPipe) blogId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new ImageFileValidator({}),
          new WidthHeightFileValidator({ width: 156, height: 156 }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ): Promise<BlogPhotosOutputModel> {
    const result = await this.commandBus.execute(
      new UploadBlogIconCommand(photo, blogId),
    );
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @Post(':blogId/images/wallpaper')
  @UseInterceptors(FileInterceptor('file'))
  async uploadBlogWallpaper(
    @Param('blogId', IsIdUUIDValidationPipe) blogId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new ImageFileValidator({}),
          new WidthHeightFileValidator({ width: 1028, height: 312 }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ): Promise<BlogPhotosOutputModel> {
    const result = await this.commandBus.execute(
      new UploadBlogWallpaperCommand(photo, blogId),
    );
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @Post(':blogId/posts/:postId/images/main')
  @UseInterceptors(FileInterceptor('file'))
  async uploadPostIcon(
    @Param('blogId', IsIdUUIDValidationPipe) blogId: string,
    @Param('postId', IsIdUUIDValidationPipe) postId: string,
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 100000 }),
          new ImageFileValidator({}),
          new WidthHeightFileValidator({ width: 940, height: 432 }),
        ],
      }),
    )
    photo: Express.Multer.File,
  ): Promise<BlogPhotosOutputModel> {
    const result = await this.commandBus.execute(
      new UploadPostMainImgCommand(photo, blogId, postId),
    );
    return result;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @HttpCode(HTTP_STATUS_CODE.NO_CONTENT_204)
  @Put(':blogId/posts/:postId')
  async updatePostOfBlog(
    @Param('blogId', IsIdUUIDValidationPipe) blogId: string,
    @Param('postId', IsIdUUIDValidationPipe) postId: string,
    @Body() inputPostModel: UpdatePostByBlogIdInputModel,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new UpdatePostCommand(blogId, postId, inputPostModel),
    );

    if (!result) throw new NotFoundException();
    return;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @HttpCode(HTTP_STATUS_CODE.NO_CONTENT_204)
  @Delete(':blogId')
  async deleteBlog(
    @Param('blogId', IsIdUUIDValidationPipe) blogId: string,
  ): Promise<void> {
    const result = await this.commandBus.execute(new DeleteBlogCommand(blogId));
    if (!result) throw new NotFoundException();
    return;
  }

  @UseGuards(JwtAccessGuard, BlogOwnerByIdGuard)
  @HttpCode(HTTP_STATUS_CODE.NO_CONTENT_204)
  @Delete(':blogId/posts/:postId')
  async deletePostOfBlog(
    @Param('postId') postId: string,
    @Param('blogId') blogId: string,
  ): Promise<void> {
    const result = await this.commandBus.execute(
      new DeletePostCommand(postId, blogId),
    );
    if (!result) throw new NotFoundException();
    return;
  }
}
