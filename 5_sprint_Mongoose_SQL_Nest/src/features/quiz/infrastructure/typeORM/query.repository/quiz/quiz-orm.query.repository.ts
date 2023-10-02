import { Injectable } from '@nestjs/common';
import { Brackets, Repository, SelectQueryBuilder } from 'typeorm';
import { Quiz } from '../../../../domain/quiz.entity';
import { QuizStatusEnum } from '../../../../../../infrastructure/utils/enums/quiz.enums';
import { InjectRepository } from '@nestjs/typeorm';
import { QuestionQuizRelation } from '../../../../domain/question-quiz-relation.entity';
import { QuizViewType } from './quiz.types.query.repository';
import { modifyQuizIntoViewModel } from '../../../../../../infrastructure/utils/functions/features/quiz.functions.helpers';

@Injectable()
export class QuizOrmQueryRepository {
  constructor(
    @InjectRepository(Quiz)
    protected quizRepository: Repository<Quiz>,
  ) {}

  async getAllInfoOfQuizById(quizId: string): Promise<QuizViewType> {
    const result = await this.quizRepository
      .createQueryBuilder('q')
      .select([
        'q."id"',
        'q."user1Id"',
        'q."user2Id"',
        'q."status"',
        'q."pairCreatedDate"',
        'q."startGameDate"',
        'q."finishGameDate"',
        'u1."login" as "login1"',
        'u2."login" as "login2"',
        'gi1."score" as "score1"',
        'gi2."score" as "score2"',
      ])
      .addSelect((qb) => this.questionsBuilder(qb, quizId), 'questions')
      .leftJoin('q.user1', 'u1')
      .leftJoin('q.user2', 'u2')
      .leftJoin('q.quizGameInfoAboutUser', 'gi1', 'gi."userId" = q."user1Id"')
      .leftJoin('q.quizGameInfoAboutUser', 'gi2', 'gi."userId" = q."user2Id"')
      .where('q."id" = :quizId', { quizId })
      .getRawMany();
    console.log(result);

    return modifyQuizIntoViewModel(result[0]);
  }

  //ADDITIONAL
  async haveUserCurrentQuiz(userId: string): Promise<boolean> {
    const result = await this.quizRepository
      .createQueryBuilder('q')
      .select()
      .where('q.status = :quizStatus', {
        quizStatus: QuizStatusEnum['PendingSecondPlayer'],
      })
      .andWhere(
        new Brackets((qb) => {
          qb.where('q.user1Id = :userId', { userId }).orWhere(
            'q.user2Id = :userId',
            { userId },
          );
        }),
      )
      .getExists();

    return result;
  }

  //PRIVATE
  private questionsBuilder(qb: SelectQueryBuilder<any>, quizId: string) {
    return qb
      .select('json_agg(to_jsonb("fiveQuestions")) as "questions"')
      .from((qb) => {
        return qb
          .select(['qqr."questionId"', 'q."body"'])
          .from(QuestionQuizRelation, 'qqr')
          .leftJoin('qqr.question', 'q')
          .where('qqr."quizId" = :quizId', { quizId })
          .limit(5);
      }, 'fiveQuestions');
  }
}