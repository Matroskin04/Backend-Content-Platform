import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { JwtPayload } from 'jsonwebtoken';

@Injectable()
export class DevicesRepository {
  constructor(@InjectDataSource() protected dataSource: DataSource) {}

  async createDevice(
    ip: string,
    title: string,
    payloadToken: JwtPayload,
    userId: string,
  ): Promise<void> {
    await this.dataSource.query(
      `
    INSERT INTO public.devices(
        "id", "ip", "title", "userId", "lastActiveDate", "expirationDate")
        VALUES ($1, $2, $3, $4, $5, $6)`,
      [
        payloadToken.deviceId,
        ip,
        title,
        userId,
        new Date(payloadToken.iat! * 1000).toISOString(),
        payloadToken.exp! - payloadToken.iat!,
      ],
    );
    return;
  }

  async updateLastActiveDateByDeviceId(
    deviceId: string,
    iat: number,
  ): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    UPDATE public."devices"
      SET "lastActiveDate" = $1
      WHERE "id" = $2`,
      [new Date(iat * 1000).toISOString(), deviceId],
    );
    return result[1] === 1;
  }

  async deleteDeviceById(deviceId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    DELETE FROM public."devices"
        WHERE "id" = $1`,
      [deviceId],
    );
    return result[1] === 1;
  }

  async deleteDevicesExcludeCurrent(deviceId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    DELETE FROM public."devices" 
        WHERE "id" != $1`,
      [deviceId],
    );

    return result[1] > 0;
  }

  async deleteAllDevicesByUserId(userId: string): Promise<boolean> {
    const result = await this.dataSource.query(
      `
    DELETE FROM public."devices"
        WHERE "userId" = $1 `,
      [userId],
    );
    return result[1] > 0;
  }
}
