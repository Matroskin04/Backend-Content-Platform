import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BlogsRepository } from '../../../infrastructure/SQL/repository/blogs.repository';
import { UsersQueryRepository } from '../../../../users/infrastructure/SQL/query.repository/users.query.repository';
import { BodyBlogType } from '../../../infrastructure/SQL/repository/blogs-blogger.types.repositories';
import { CreateBlogDTO } from '../dto/create-blog.dto';
import { UsersOrmQueryRepository } from '../../../../users/infrastructure/typeORM/query.repository/users-orm.query.repository';
import { BlogsOrmRepository } from '../../../infrastructure/typeORM/repository/blogs-orm.repository';

export class CreateBlogCommand {
  constructor(public blogDTO: BodyBlogType, public userId: string) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    protected blogsOrmRepository: BlogsOrmRepository,
    protected usersOrmQueryRepository: UsersOrmQueryRepository,
  ) {}

  async execute(command: CreateBlogCommand): Promise<CreateBlogDTO> {
    const { blogDTO, userId } = command;

    const user = await this.usersOrmQueryRepository.getUserLoginById(userId);
    if (!user) throw new Error('User is not found');

    const result = await this.blogsOrmRepository.createBlog(blogDTO, userId);
    return result;
  }
}
