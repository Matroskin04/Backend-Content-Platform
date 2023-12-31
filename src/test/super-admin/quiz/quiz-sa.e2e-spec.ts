import { INestApplication } from '@nestjs/common';
import { startApp } from '../../test.utils';
import { deleteAllDataTest } from '../../utils/general/delete-all-data.helper';
import { HTTP_STATUS_CODE } from '../../../infrastructure/utils/enums/http-status.enums';
import { v4 as uuidv4 } from 'uuid';
import { createErrorsMessageTest } from '../../utils/general/errors-message.helper';
import { DataSource } from 'typeorm';
import { quizzesRequestsTestManager } from '../../utils/quiz/quizzes-requests-test.manager';
import { quizzesResponsesTestManager } from '../../utils/quiz/quizzes-responses-test.manager';

describe('Quiz (SA); /sa/quiz', () => {
  jest.setTimeout(5 * 60 * 1000);

  //vars for starting app and testing
  let app: INestApplication;
  let httpServer;
  let dataSource: DataSource;

  beforeAll(async () => {
    const info = await startApp();
    app = info.app;
    httpServer = info.httpServer;

    dataSource = await app.resolve(DataSource);
  });

  afterAll(async () => {
    await httpServer.close();
    await app.close();
  });

  //correct data question
  let correctQuestionId;
  let questionData;
  const correctBody = 'Solve: 3 + 3 = ?';
  const correctAnswers = ['6', 'шесть', 'six'];
  //incorrectData question
  const bodyLength9 = 'a'.repeat(9);
  const bodyLength501 = 'a'.repeat(501);

  describe(`/questions (GET) - get all questions`, () => {
    let questionsIds;
    beforeAll(async () => {
      await deleteAllDataTest(httpServer);

      //create 9 questions
      questionsIds = await quizzesRequestsTestManager.create9Questions(
        httpServer,
      );
    });

    it(`- (401) sa login is incorrect
              - (401) sa password is incorrect`, async () => {
      //sa login is incorrect
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        null,
        'incorrectLogin',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);

      //sa password is incorrect
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        null,
        null,
        'IncorrectPass',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);
    });

    it(`+ (200) should return 9 questions`, async () => {
      const result = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds,
          9,
        ),
      );
    });

    it(`+ (200) should return 3 questions (query: pageSize=3, pageNumber=2)
              + (200) should return 4 questions (query: pageSize=5, pageNumber=2)`, async () => {
      //3 questions
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'pageSize=3&&pageNumber=2',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result1.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(3, 6),
          9,
          3,
          2,
          3,
        ),
      );

      //4 questions
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'pageSize=5&&pageNumber=2',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result2.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(5),
          9,
          2,
          2,
          5,
        ),
      );
    });

    it(`+ (200) should return 5 questions (query: sortBy=body&&pageSize=5)
              + (200) should return 5 questions (query: sortBy=createdAt&&pageSize=5)`, async () => {
      //sortBy=body, total 9 questions
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortBy=body&&pageSize=5',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result1.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(0, 5),
          9,
          2,
          1,
          5,
        ),
      );

      //sortBy=createdAt, total 9 questions
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortBy=createdAt&&pageSize=5',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result2.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(0, 5),
          9,
          2,
          1,
          5,
        ),
      );
    });

    it(`+ (200) should return 9 questions (query: sortDirection=asc)
              + (200) should return 9 questions (query: sortBy=id&&sortDirection=desc)
              + (200) should return 9 questions (query: sortBy=body&&sortDirection=asc)`, async () => {
      //sortDirection=asc, total 9 questions
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortDirection=asc',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result1.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          [...questionsIds].reverse(),
          9,
          1,
          1,
          10,
        ),
      );

      //sortBy=id&&sortDirection=desc, total 9 questions
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortBy=id&sortDirection=desc',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result2.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          [...questionsIds].sort().reverse(),
          9,
          1,
          1,
          10,
        ),
      );

      //sortBy=body&&sortDirection=asc, total 9 questions
      const result3 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortBy=body&sortDirection=asc',
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result3.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          [...questionsIds].reverse(),
          9,
          1,
          1,
          10,
        ),
      );
    });

    it(`+ (200) should return 1 question (query: bodySearchTerm=irs)
              + (200) should return 7 questions (query: bodySearchTerm=TH)
              + (200) should return 4 questions (query: bodySearchTerm=S)`, async () => {
      //bodySearchTerm=irs, 1 question
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'bodySearchTerm=irs',
      );

      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result1.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          [questionsIds[7]],
          1,
          1,
          1,
          10,
        ),
      );

      //bodySearchTerm=TH, 7 questions
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'bodySearchTerm=TH',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result2.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          [...questionsIds.slice(0, 6), questionsIds[8]],
          7,
          1,
          1,
          10,
        ),
      );

      //bodySearchTerm=S, 4 questions
      const result3 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'bodySearchTerm=V',
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result3.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.filter((e, i) => i === 2),
          1,
          1,
          1,
          10,
        ),
      );
    });

    it(`(Addition) + (204) should publish 3 questions
              + (200) should return 9 questions (query: publishedStatus=all)
              + (200) should return 3 questions (query: publishedStatus=published)
              + (200) should return 6 questions (query: publishedStatus=notPublished)`, async () => {
      //publish 3 questions
      for (const i of questionsIds.slice(0, 3)) {
        const result = await quizzesRequestsTestManager.publishQuestionSa(
          httpServer,
          i,
          true,
        );
        expect(result.statusCode).toBe(HTTP_STATUS_CODE.NO_CONTENT_204);
      }

      //publishedStatus=all, 9 questions
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'publishedStatus=all',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result1.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds,
          9,
          1,
          1,
          10,
        ),
      );

      //publishedStatus=published, 3 questions
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'publishedStatus=published',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result2.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(0, 3),
          3,
          1,
          1,
          10,
        ),
      );

      //publishedStatus=notPublished, 6 questions
      const result3 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'publishedStatus=notPublished',
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
      expect(result3.body).toEqual(
        quizzesResponsesTestManager.createResponseAllQuestionsSa(
          questionsIds.slice(3),
          6,
          1,
          1,
          10,
        ),
      );
    });

    it(`- (400) sortBy has incorrect value (query: sortBy=Truncate;)
              - (400) sortDirection has incorrect value (query: sortDirection=Truncate;)
              - (400) publishedStatus has incorrect value (query: publishedStatus=Truncate;)`, async () => {
      //status 400
      const result1 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortBy=Truncate;',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result1.body).toEqual(createErrorsMessageTest(['sortBy']));

      //status 400
      const result2 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'sortDirection=Truncate;',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result2.body).toEqual(createErrorsMessageTest(['sortDirection']));

      //status 400
      const result3 = await quizzesRequestsTestManager.getAllQuestionsSa(
        httpServer,
        'publishedStatus=Truncate;',
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result3.body).toEqual(
        createErrorsMessageTest(['publishedStatus']),
      );
    });
  });

  describe(`/questions (POST) - create new question`, () => {
    beforeAll(async () => {
      await deleteAllDataTest(httpServer);
    });

    it(`- (401) sa login is incorrect
              - (401) sa password is incorrect`, async () => {
      //sa login is incorrect
      const result1 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        null,
        null,
        'incorrectLogin',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);

      //sa password is incorrect
      const result2 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        null,
        null,
        null,
        'IncorrectPass',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);
    });

    it(`- (400) incorrect body (too large length) and correctAnswers (should be an array)
              - (400) incorrect body (too small length) and correctAnswers (array should be filled by strings)
              - (400) incorrect body (should be a string) and correctAnswers (length should be > 0)
              - (400) incorrect body (the length should not be less 10 after trim)`, async () => {
      //body length, answers not array
      const result1 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        bodyLength501,
        'not an array',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result1.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body length, answers array contains not a string
      const result2 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        bodyLength9,
        ['123', 123],
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result2.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body is not a string, length of array < 1
      const result3 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        123,
        [],
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result3.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body length is less than 10 after trim
      const result4 = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        '              ',
        ['correct'],
      );
      expect(result4.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result4.body).toEqual(createErrorsMessageTest(['body']));
    });

    it(`+ (201) should create question for quiz`, async () => {
      const result = await quizzesRequestsTestManager.createQuestionSa(
        httpServer,
        correctBody,
        correctAnswers,
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
      expect(result.body).toEqual(
        quizzesResponsesTestManager.createResponseSaQuestion(
          null,
          false,
          correctBody,
          [correctAnswers.join()],
        ),
      );
    });
  });

  describe(`/questions/:id (PUT) - update question`, () => {
    beforeAll(async () => {
      await deleteAllDataTest(httpServer);

      questionData = await quizzesRequestsTestManager.createCorrectQuestionSa(
        httpServer,
      );
      correctQuestionId = questionData.id;
    });

    it(`- (401) sa login is incorrect
              - (401) sa password is incorrect`, async () => {
      //sa login is incorrect
      const result1 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        null,
        null,
        'incorrectLogin',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);

      //sa password is incorrect
      const result2 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        null,
        null,
        null,
        'IncorrectPass',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);
    });

    it(`- (400) incorrect body (too large length) and correctAnswers (should be an array)
              - (400) incorrect body (too small length) and correctAnswers (array should be filled by strings)
              - (400) incorrect body (should be a string) and correctAnswers (length should be > 0)
              - (400) incorrect body (the length should not be less 10 after trim)`, async () => {
      //body length, answers not array
      const result1 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        bodyLength501,
        'not an array',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result1.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body length, answers array contains not a string
      const result2 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        bodyLength9,
        ['123', 123],
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result2.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body is not a string, length of array < 1
      const result3 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        123,
        [],
      );
      expect(result3.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result3.body).toEqual(
        createErrorsMessageTest(['body', 'correctAnswers']),
      );
      //body length is less than 10 after trim
      const result4 = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        '              ',
        ['correct'],
      );
      expect(result4.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result4.body).toEqual(createErrorsMessageTest(['body']));
    });

    it(`- (404) question with such id doesn't exist`, async () => {
      const result = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        uuidv4(),
        null,
        null,
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.NOT_FOUND_404);
    });

    it(`+ (204) should update question`, async () => {
      const result = await quizzesRequestsTestManager.updateQuestionSa(
        httpServer,
        correctQuestionId,
        'new question body',
        ['new 1', 'new 2'],
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.NO_CONTENT_204);

      //check that fields were changed, and updated date was set
      const updatedQuestion =
        await quizzesRequestsTestManager.getQuestionAllInfo(
          dataSource,
          correctQuestionId,
        );
      expect(updatedQuestion.body).toBe('new question body');
      expect(updatedQuestion.correctAnswers).toBe('new 1,new 2');
      expect(updatedQuestion.updatedAt).not.toBeNull();
    });
  });

  describe(`/questions/:id/publish (PUT) - update publish status of a question`, () => {
    let questionWithoutAnswersId;
    beforeAll(async () => {
      await deleteAllDataTest(httpServer);

      questionData = await quizzesRequestsTestManager.createCorrectQuestionSa(
        httpServer,
      );
      correctQuestionId = questionData.id;

      const question2 =
        await quizzesRequestsTestManager.createCorrectQuestionSa(
          httpServer,
          'some interesting question',
          null,
        );
      questionWithoutAnswersId = question2.id;
    });

    it(`- (401) sa login is incorrect
              - (401) sa password is incorrect`, async () => {
      //sa login is incorrect
      const result1 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        correctQuestionId,
        true,
        'incorrectLogin',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);

      //sa password is incorrect
      const result2 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        correctQuestionId,
        true,
        null,
        'IncorrectPass',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);
    });

    it(`- (400) input value of the field 'published' is not boolean,
              - (400) specified question doesn't have correct answers`, async () => {
      //value is not boolean
      const result1 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        correctQuestionId,
        'string',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result1.body).toEqual(createErrorsMessageTest(['published']));

      //question doesn't have correct answers
      const result2 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        questionWithoutAnswersId,
        true,
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.BAD_REQUEST_400);
      expect(result2.body).toEqual(createErrorsMessageTest(['correctAnswers']));
    });

    it(`- (404) question with such id doesn't exist`, async () => {
      const result = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        uuidv4(),
        true,
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.NOT_FOUND_404);
    });

    it(`+ (204) should set true for field 'published' of the question
              + (204) should set false for field 'published' of the question`, async () => {
      //published true
      const result1 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        correctQuestionId,
        true,
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.NO_CONTENT_204);

      //check that field was changed
      const updatedQuestion1 =
        await quizzesRequestsTestManager.getQuestionAllInfo(
          dataSource,
          correctQuestionId,
        );
      expect(updatedQuestion1.published).toBeTruthy();
      expect(updatedQuestion1.updatedAt).not.toBeNull();

      //published false
      const result2 = await quizzesRequestsTestManager.publishQuestionSa(
        httpServer,
        correctQuestionId,
        false,
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.NO_CONTENT_204);

      //check that field was changed
      const updatedQuestion2 =
        await quizzesRequestsTestManager.getQuestionAllInfo(
          dataSource,
          correctQuestionId,
        );
      expect(updatedQuestion2.published).toBeFalsy();
      expect(updatedQuestion2.updatedAt).not.toBeNull();
    });
  });

  describe(`/questions/:id (DELETE) - delete question`, () => {
    beforeAll(async () => {
      await deleteAllDataTest(httpServer);

      questionData = await quizzesRequestsTestManager.createCorrectQuestionSa(
        httpServer,
      );
      correctQuestionId = questionData.id;
    });

    it(`- (401) sa login is incorrect
              - (401) sa password is incorrect`, async () => {
      //sa login is incorrect
      const result1 = await quizzesRequestsTestManager.deleteQuestionSa(
        httpServer,
        correctQuestionId,
        'incorrectLogin',
      );
      expect(result1.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);

      //sa password is incorrect
      const result2 = await quizzesRequestsTestManager.deleteQuestionSa(
        httpServer,
        correctQuestionId,
        null,
        'IncorrectPass',
      );
      expect(result2.statusCode).toBe(HTTP_STATUS_CODE.UNAUTHORIZED_401);
    });

    it(`- (404) question with such id doesn't exist`, async () => {
      const result = await quizzesRequestsTestManager.deleteQuestionSa(
        httpServer,
        uuidv4(),
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.NOT_FOUND_404);
    });

    it(`+ (204) should delete question`, async () => {
      const result = await quizzesRequestsTestManager.deleteQuestionSa(
        httpServer,
        correctQuestionId,
      );
      expect(result.statusCode).toBe(HTTP_STATUS_CODE.NO_CONTENT_204);

      //check that deletion is successful
      const updatedQuestion =
        await quizzesRequestsTestManager.getQuestionAllInfo(
          dataSource,
          correctQuestionId,
        );
      expect(updatedQuestion).toBeNull();
    });
  });
});
