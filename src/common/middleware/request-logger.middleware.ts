import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { randomUUID } from 'crypto';

/**
 * RequestLoggerMiddleware —— 全链路请求日志
 *
 * 功能：
 *   1. 每个请求生成一个 requestId（用 crypto.randomUUID()）
 *      → 存到 req.requestId，让后续切面/handler 都能拿到
 *   2. 记录"请求进入"和"响应完成"两个时间点
 *   3. 响应完成时打印一条结构化日志（方法/URL/状态码/耗时/IP）
 *
 * 这就是教科书级的"全链路请求日志"——线上服务必备
 */
@Injectable()
export class RequestLoggerMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = (req.headers['x-request-id'] as string) ?? randomUUID();
    req.requestId = requestId;
    res.setHeader('x-request-id', requestId);

    const start = Date.now();

    // res.on('finish') 在响应"完全发送完"时触发（已经无法再改）
    res.on('finish', () => {
      const duration = Date.now() - start;
      const { method, originalUrl, ip } = req;
      const { statusCode } = res;

      const level =
        statusCode >= 500 ? 'ERROR' : statusCode >= 400 ? 'WARN' : 'INFO';

      console.log(
        `[${level}] [${requestId.slice(0, 8)}] ${method} ${originalUrl} ${statusCode} ${duration}ms ${ip}`,
      );
    });

    next();
  }
}
