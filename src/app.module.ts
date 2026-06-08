import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from './logger.service';
import { UsersModule } from './users/users.module';
import { BooksModule } from './books/books.module';

@Module({
  imports: [UsersModule, BooksModule], // ← 关键：把 UsersModule 装配进根模块
  controllers: [AppController],
  providers: [AppService, LoggerService],
})
export class AppModule {}
