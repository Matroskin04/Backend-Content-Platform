import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
  BodyPostByBlogIdType,
  PostTypeWithId,
} from '../../infrastructure/SQL/repository/posts.types.repositories';
import { BlogsQueryRepository } from '../../../blogs/infrastructure/SQL/query.repository/blogs.query.repository';
import { modifyPostIntoInitialViewModel } from '../../../../infrastructure/utils/functions/features/posts.functions.helpers';
import { PostsRepository } from '../../infrastructure/SQL/repository/posts.repository';

export class UpdatePostCommand {
  constructor(
    public blogId: string,
    public postId: string,
    public postDTO: BodyPostByBlogIdType,
  ) {}
}

@CommandHandler(UpdatePostCommand)
export class UpdatePostUseCase implements ICommandHandler<UpdatePostCommand> {
  constructor(protected postsRepository: PostsRepository) {}

  async execute(command: UpdatePostCommand): Promise<boolean> {
    const { postDTO, postId, blogId } = command;
    return this.postsRepository.updatePost(postDTO, postId);
  }
}
