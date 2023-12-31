import request from 'supertest';
import { HTTP_STATUS_CODE } from '../../../infrastructure/utils/enums/http-status.enums';
import { loginUserTest } from '../auth/auth-public.helpers';
import { AccessTokensAndUsersIdType } from '../types/blogs.types';
import { usersRequestsTestManager } from '../../utils/users/users-requests-test.manager';
import { blogsRequestsTestManager } from '../../utils/blogs/blogs-requests-test.manager';

export async function getBlogByIdPublicTest(httpServer, blogId) {
  return request(httpServer).get(`/api/blogs/${blogId}`);
}

export async function getAllBlogsPublicTest(httpServer, query?) {
  return request(httpServer).get(`/api/blogs`).query(query);
}

export async function create9BlogsBy3Users(
  httpServer,
  accessTokens: string[],
): Promise<string[]> {
  const blogNumber = [
    'first',
    'second',
    'third',
    'fourth',
    'fifth',
    'sixth',
    'seventh',
    'eighth',
    'ninth',
  ];
  const blogsIds: any = [];
  let count = 1;
  for (const i of blogNumber) {
    const result = await blogsRequestsTestManager.createBlogBlogger(
      httpServer,
      accessTokens[Math.floor((count - 1) / 3)],
      `Name ${count} ${i}`,
      `Description ${i}`,
      `https://samurai.it-incubator.io`,
    );
    expect(result.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
    blogsIds.push(result.body.id);
    count++;
  }
  return blogsIds.reverse();
}

export async function createAndLogin3UsersTest(
  httpServer,
): Promise<AccessTokensAndUsersIdType> {
  //user1
  const user1 = await usersRequestsTestManager.createUserSa(
    httpServer,
    'Login1',
    'Password1',
    'email1@mail.ru',
  );
  expect(user1.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
  const result1 = await loginUserTest(httpServer, 'Login1', 'Password1');
  expect(result1.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
  const accessToken1 = result1.body.accessToken;

  //user2
  const user2 = await usersRequestsTestManager.createUserSa(
    httpServer,
    'Login2',
    'Password2',
    'email2@mail.ru',
  );
  expect(user2.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
  const result2 = await loginUserTest(httpServer, 'Login2', 'Password2');
  expect(result2.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
  const accessToken2 = result2.body.accessToken;

  //user3
  const user3 = await usersRequestsTestManager.createUserSa(
    httpServer,
    'Login3',
    'Password3',
    'email3@mail.ru',
  );
  expect(user3.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
  const result3 = await loginUserTest(httpServer, 'Login3', 'Password3');
  expect(result3.statusCode).toBe(HTTP_STATUS_CODE.OK_200);
  const accessToken3 = result3.body.accessToken;

  return [
    { accessToken: accessToken1, userId: user1.body.id },
    { accessToken: accessToken2, userId: user2.body.id },
    { accessToken: accessToken3, userId: user3.body.id },
  ];
}
