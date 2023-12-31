import { Injectable } from '@nestjs/common';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { ConfigType } from '../../configuration/configuration';
import * as Buffer from 'buffer';

@Injectable()
export class S3StorageAdapter {
  s3Client: S3Client;
  constructor(protected configService: ConfigService<ConfigType>) {
    this.s3Client = new S3Client({
      region: 'ru-central1',
      endpoint: 'https://storage.yandexcloud.net',
      credentials: {
        accessKeyId: 'YCAJEiqYDt3UgTL21GiDwC9t8',
        secretAccessKey: 'YCMul3imvfJ3ubN9Tt45cZCIpv2Cg-2KhQlubclM',
      },
    });
  }

  async saveIconForBlog(blogId: string, photo: Buffer): Promise<string> {
    try {
      const iconId = uuidv4();
      const fileUrl = `blogs/${blogId}/icons/${iconId}_icon.png`;
      // Put an object into an Amazon S3 bucket.
      const result = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get('S3', { infer: true })!.BUCKET_NAME,
          Key: fileUrl,
          Body: photo,
          ContentType: 'image/png',
        }),
      );

      return fileUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async saveIconForPost(postId: string, photo: Buffer): Promise<string> {
    try {
      const iconId = uuidv4();
      const fileUrl = `posts/${postId}/icons/${iconId}_icon.png`;
      // Put an object into an Amazon S3 bucket.
      const result = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get('S3', { infer: true })!.BUCKET_NAME,
          Key: fileUrl,
          Body: photo,
          ContentType: 'image/png',
        }),
      );

      return fileUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async saveWallpaperForBlog(blogId: string, photo: Buffer): Promise<string> {
    try {
      const wallpaperId = uuidv4();
      const fileUrl = `blogs/${blogId}/wallpapers/${wallpaperId}_wallpaper.png`;
      // Put an object into an Amazon S3 bucket.
      const result = await this.s3Client.send(
        new PutObjectCommand({
          Bucket: this.configService.get('S3', { infer: true })!.BUCKET_NAME,
          Key: fileUrl,
          Body: photo,
          ContentType: 'image/png',
        }),
      );
      return fileUrl;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }

  async deleteWallpaperForBlog(blogId: string, keyUrl: string): Promise<void> {
    try {
      const wallpaperId = uuidv4();
      const fileUrl = `blogs/${blogId}/wallpapers/${wallpaperId}_wallpaper.png`;
      // Put an object into an Amazon S3 bucket.
      const result = await this.s3Client.send(
        new DeleteObjectCommand({
          Bucket: this.configService.get('S3', { infer: true })!.BUCKET_NAME,
          Key: keyUrl,
        }),
      );
      return;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }
}
