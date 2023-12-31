import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { BodyBlogType } from '../../../infrastructure/SQL/repository/blogs-blogger.types.repositories';
import { CreateBlogDTO } from '../dto/create-blog.dto';
import { UsersOrmQueryRepository } from '../../../../users/infrastructure/typeORM/query.repository/users-orm.query.repository';
import { BlogsOrmRepository } from '../../../infrastructure/typeORM/repository/blogs-orm.repository';
import { modifyBlogIntoViewGeneralModel } from '../../../../../infrastructure/utils/functions/features/blog.functions.helpers';
import { ConfigService } from '@nestjs/config';
import { ConfigType } from '../../../../../configuration/configuration';

export class CreateBlogCommand {
  constructor(public blogDTO: BodyBlogType, public userId: string | null) {}
}

@CommandHandler(CreateBlogCommand)
export class CreateBlogUseCase implements ICommandHandler<CreateBlogCommand> {
  constructor(
    protected blogsOrmRepository: BlogsOrmRepository,
    protected usersOrmQueryRepository: UsersOrmQueryRepository,
    protected configService: ConfigService<ConfigType>,
  ) {}

  async execute(command: CreateBlogCommand): Promise<CreateBlogDTO> {
    const { blogDTO, userId } = command;

    if (userId !== null) {
      const user = await this.usersOrmQueryRepository.getUserLoginById(userId);
      if (!user) throw new Error('User is not found');
    }

    const result = await this.blogsOrmRepository.createBlog(blogDTO, userId);
    return modifyBlogIntoViewGeneralModel(result, this.configService);
  }
}
