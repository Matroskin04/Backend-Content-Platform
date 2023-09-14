import request from 'supertest';
import { HTTP_STATUS_CODE } from '../../../infrastructure/utils/enums/http-status';
import { createPostTest } from '../../blogger/blogs/posts-blogger.helpers';
import { PostsAndUsersIdType } from '../types/posts.types';

export async function getPostByIdPublicTest(httpServer, postId, accessToken?) {
  return request(httpServer)
    .get(`/hometask-nest/posts/${postId}`)
    .set('Authorization', `Bearer ${accessToken}`);
}

export async function getPostsPublicTest(httpServer, query?, accessToken?) {
  return request(httpServer)
    .get(`/hometask-nest/posts`)
    .set('Authorization', `Bearer ${accessToken}`)
    .query(query ?? '');
}

export async function UpdateStatusLikeOfPostTest(
  httpServer,
  postId,
  likeStatus,
  accessToken,
) {
  return request(httpServer)
    .put(`/hometask-nest/posts/${postId}/like-status`)
    .set('Authorization', `Bearer ${accessToken}`)
    .send({ likeStatus });
}

export async function create9PostsOf3BlogsBy3Users(
  httpServer,
  blogsId: [string, string, string],
  accessTokens: [string, string, string],
  usersId: [string, string, string],
): Promise<PostsAndUsersIdType> {
  const postNumber = [
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
  const postsIdsInfo: any = [];
  let count = 0;
  for (const i of postNumber) {
    const result = await createPostTest(
      httpServer,
      blogsId[Math.floor(count / 3)],
      accessTokens[Math.floor(count / 3)],
      `Title ${count} ${i}`,
      `ShortDescription ${count} ${i}`,
      `Content ${count} ${i}`,
    );
    expect(result.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
    postsIdsInfo.push({
      id: result.body.id,
      userId: usersId[Math.floor(count / 3)],
    });
    count++;
  }
  return postsIdsInfo;
}

export async function create9PostsOfBlog(
  httpServer,
  blogId: string,
  accessToken: string,
): Promise<string[]> {
  const postNumber = [
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
  const postsIds: any = [];
  let count = 1;
  for (const i of postNumber) {
    const result = await createPostTest(
      httpServer,
      blogId,
      accessToken,
      `Title ${count} ${i}`,
      `ShortDescription ${count} ${i}`,
      `Content ${count} ${i}`,
    );
    expect(result.statusCode).toBe(HTTP_STATUS_CODE.CREATED_201);
    postsIds.push(result.body.id);
    count++;
  }
  return postsIds.reverse();
}

export function createResponseSinglePost(
  id?,
  title?,
  shortDescription?,
  content?,
  blogId?,
  blogName?,
  likesCount?: number,
  dislikesCount?: number,
  myStatus?: 'Like' | 'Dislike',
) {
  return {
    id: id ?? expect.any(String),
    title: title ?? expect.any(String),
    shortDescription: shortDescription ?? expect.any(String),
    content: content ?? expect.any(String),
    blogId: blogId ?? expect.any(String),
    blogName: blogName ?? expect.any(String),
    createdAt: expect.any(String),
    extendedLikesInfo: {
      likesCount: likesCount ?? 0,
      dislikesCount: dislikesCount ?? 0,
      myStatus: myStatus ?? 'None',
      newestLikes: expect.any(Array),
    },
  };
}
