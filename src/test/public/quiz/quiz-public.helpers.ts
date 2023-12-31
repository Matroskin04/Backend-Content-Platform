import request from 'supertest';
import { QuizStatusType } from '../../../infrastructure/types/quiz-questions.general.types';
import {
  regexpISOSString,
  regexpUUID,
} from '../../../infrastructure/utils/regexp/general-regexp';
import { HTTP_STATUS_CODE } from '../../../infrastructure/utils/enums/http-status.enums';
import { toBeOneOf } from 'jest-extended';
expect.extend({ toBeOneOf });

export async function connectPlayerToQuizTest(httpServer, accessToken) {
  return request(httpServer)
    .post(`/api/pair-game-quiz/pairs/connection`)
    .set('Authorization', `Bearer ${accessToken}`);
}

export async function sendAnswerTest(httpServer, accessToken, answer) {
  return request(httpServer)
    .post(`/api/pair-game-quiz/pairs/my-current/answers`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ answer });
}

export async function getMyStatisticTest(httpServer, accessToken) {
  return request(httpServer)
    .get('/api/pair-game-quiz/users/my-statistic')
    .set('Authorization', `Bearer ${accessToken}`);
}

export async function getStatisticOfAllUsers(httpServer, query?) {
  return request(httpServer)
    .get('/api/pair-game-quiz/users/top')
    .query(query ?? '');
}

export async function getMyCurrentQuizTest(httpServer, accessToken) {
  return request(httpServer)
    .get(`/api/pair-game-quiz/pairs/my-current`)
    .set('Authorization', `Bearer ${accessToken}`);
}

export async function getAllQuizzesTest(httpServer, accessToken, query?) {
  return request(httpServer)
    .get(`/api/pair-game-quiz/pairs/my`)
    .set('Authorization', `Bearer ${accessToken}`)
    .query(query ?? '');
}

export async function getQuizByIdTest(httpServer, quizId, accessToken) {
  return request(httpServer)
    .get(`/api/pair-game-quiz/pairs/${quizId}`)
    .set('Authorization', `Bearer ${accessToken}`);
}

export async function addAnswersToQuizTest(
  httpServer,
  accessToken,
  numberOfCorrect,
  numberOfAnswers = 5,
) {
  const answersArray = new Array(numberOfAnswers).fill('Incorrect');
  answersArray.fill('correctAnswer', 0, numberOfCorrect);
  //send 5 answers
  for (const answer of answersArray) {
    const result = await sendAnswerTest(httpServer, accessToken, answer);
    expect(result.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
  }

  return;
}

export function createResponseAnswerTest(
  questionId?,
  answerStatus?: 'Correct' | 'Incorrect',
) {
  return {
    questionId: questionId ?? expect.any(String),
    answerStatus:
      answerStatus ?? expect.stringMatching(/^(Correct|Incorrect)$/),
    addedAt: expect.stringMatching(regexpISOSString),
  };
}

export function createResponseStatisticTest(
  sumScore?,
  avgScores?,
  gamesCount?,
  winsCount?,
  lossesCount?,
  drawsCount?,
) {
  return {
    sumScore: sumScore ?? 0,
    avgScores: avgScores ?? 0,
    gamesCount: gamesCount ?? 0,
    winsCount: winsCount ?? 0,
    lossesCount: lossesCount ?? 0,
    drawsCount: drawsCount ?? 0,
  };
}

export function createResponseAllStatisticTest(
  totalCount: number,
  userId?: string[] | null,
  sumScore?: number[] | null,
  avgScores?: number[] | null,
  gamesCount?: number[] | null,
  winsCount?: number[] | null,
  lossesCount?: number[] | null,
  drawsCount?: number[] | null,
  pagesCount?: number | null,
  page?: number | null,
  pageSize?: number | null,
) {
  const items: any = [];
  for (let i = 0; i < totalCount; i++) {
    items.push({
      sumScore: sumScore ? sumScore[i] : expect.any(Number),
      avgScores: avgScores ? avgScores[i] : expect.any(Number),
      gamesCount: gamesCount ? gamesCount[i] : expect.any(Number),
      winsCount: winsCount ? winsCount[i] : expect.any(Number),
      lossesCount: lossesCount ? lossesCount[i] : expect.any(Number),
      drawsCount: drawsCount ? drawsCount[i] : expect.any(Number),
      player: {
        id: userId ? userId[i] : expect.stringMatching(regexpUUID),
        login: expect.any(String),
      },
    });
  }
  return {
    pagesCount: pagesCount ?? 1,
    page: page ?? 1,
    pageSize: pageSize ?? 10,
    totalCount: totalCount ?? 4,
    items: items,
  };
}

export function createResponseSingleQuizTest(
  quizStatus?: QuizStatusType,
  questions?: '5questions' | null,
  quizId?: string | null,
  user1Id?: string | null,
  score1?: number | null,
  user2Id?: string | null,
  login2?: string | null,
  score2?: number | null,
  startDate?: null | 'string',
  answerStatus1?: 'string' | null,
  answerStatus2?: 'string' | null,
  finishDate?: null | 'string',
) {
  return {
    id: quizId ?? expect.any(String),
    firstPlayerProgress: {
      answers: answerStatus1
        ? expect.arrayContaining([
            expect.objectContaining({
              questionId: expect.any(String),
              answerStatus: expect.toBeOneOf(['Correct', 'Incorrect']),
              addedAt: expect.stringMatching(regexpISOSString),
            }),
          ])
        : [],
      player: {
        id: user1Id ?? expect.any(String),
        login: expect.any(String),
      },
      score: score1 ?? expect.any(Number),
    },
    secondPlayerProgress: user2Id
      ? {
          answers: answerStatus2
            ? expect.arrayContaining([
                expect.objectContaining({
                  questionId: expect.any(String),
                  answerStatus: expect.toBeOneOf(['Correct', 'Incorrect']),
                  addedAt: expect.stringMatching(regexpISOSString),
                }),
              ])
            : [],
          player: {
            id: user2Id ?? expect.any(String),
            login: login2 ?? expect.any(String),
          },
          score: score2 ?? expect.any(Number),
        }
      : null,
    questions: questions
      ? expect.arrayContaining([
          expect.objectContaining({
            id: expect.any(String),
            body: expect.any(String),
          }),
        ])
      : null,
    status: quizStatus ?? expect.any(String),
    pairCreatedDate: expect.stringMatching(regexpISOSString),
    startGameDate:
      startDate === 'string' ? expect.stringMatching(regexpISOSString) : null,
    finishGameDate:
      finishDate === 'string' ? expect.stringMatching(regexpISOSString) : null,
  };
}
