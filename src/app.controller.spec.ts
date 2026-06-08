import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerService } from './logger.service';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    // ─────────────────────────────────────────────────────────
    // 教学要点：构造一个全新的测试容器
    //
    // 关键改动（对比脚手架原版）：
    //   1. AppService 现在依赖 LoggerService → 测试容器必须知道这件事
    //   2. 我们用 useValue 给 LoggerService 提供一个 Mock 对象
    //   3. Mock 的方法用 jest.fn() —— 它会记录"被调用过几次、参数是什么"
    //      让我们之后可以断言行为
    // ─────────────────────────────────────────────────────────
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        AppService,
        {
          provide: LoggerService, // 注入 token：还是 LoggerService 类
          useValue: {
            // 这个对象会被注入到 AppService 的 logger 字段里
            log: jest.fn(), // jest.fn() = 可监视的空函数
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('root', () => {
    it('should return "Hello World!"', () => {
      expect(appController.getHello()).toBe('Hello World!');
    });
  });
});
