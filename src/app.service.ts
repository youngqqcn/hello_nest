import { Injectable } from '@nestjs/common';
import { LoggerService } from './logger.service';

@Injectable()
export class AppService {
  constructor(private readonly logger: LoggerService) {}

  getHello(): string {
    // return 'Hello World!';
    this.logger.log('Hello World!');
    return 'Hello World!';
  }
}
