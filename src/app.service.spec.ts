import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { LoggerService } from './logger.service';

/**
 * ─────────────────────────────────────────────────────────────────
 * 学习目标：用 DI 测试 AppService —— 真实的 logic，Mock 的 dependency
 *
 * 这个测试要回答的问题：
 *   1. AppService.getHello() 是否返回正确的字符串？
 *   2. AppService 是否 *正确调用了 LoggerService*（DI 协作行为）？
 *
 * 为什么需要 Mock LoggerService：
 *   - 真实的 LoggerService 会往 console 输出，测试时刷屏吵
 *   - 真实的实现里我们没法断言"被调用过、传了什么参数"
 *   - 把它换成 jest.fn()，每次调用都会被记录
 * ─────────────────────────────────────────────────────────────────
 */
describe('AppService', () => {
  let service: AppService;
  let loggerMock: { log: jest.Mock }; // Mock 对象的类型 —— 后面要断言它

  beforeEach(async () => {
    // ─── TODO #1：创建测试容器（约 5 行） ──────────────────────
    // 提示：
    //   - 用 Test.createTestingModule({ providers: [...] }).compile()
    //   - providers 数组里需要：
    //       a) 真实的 AppService（这是我们要测试的目标）
    //       b) 一个 Mock 替身代替 LoggerService，用 useValue 语法：
    //          { provide: LoggerService, useValue: { log: jest.fn() } }
    //   - 别忘了 await
    //
    // 写完后，从容器里取出实例存到 service 和 loggerMock 两个变量：
    //   service    = module.get<AppService>(AppService);
    //   loggerMock = module.get(LoggerService);
    //
    // 思考题（写之前想一下）：
    //   - 为什么 module.get(LoggerService) 返回的就是我们传入的 mock 对象？
    //     （提示：DI 容器把 LoggerService 当 token，useValue 的对象当实现）

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        // 写在这里 ↓
        AppService,
        {
          provide: LoggerService,
          useValue: {
            log: jest.fn(), // jest.fn() = 可监视的空函数
            // log: console.log,
          },
        },
      ],
    }).compile();

    // 写在这里 ↓ （取出实例）
    service = module.get<AppService>(AppService);
    loggerMock = module.get(LoggerService);
  });

  describe('getHello', () => {
    it('应该返回 "Hello World!"', () => {
      // ─── TODO #2：断言返回值（1 行） ─────────────────────────
      // 提示：expect(...).toBe('Hello World!')
      expect(service.getHello()).toBe('Hello World!');
    });

    it('应该调用 logger.log 一次，且参数是 "Hello World!"', () => {
      // ─── TODO #3：触发行为 + 断言 Mock 被正确调用（约 3 行） ──
      // 提示：
      //   1. 先调用 service.getHello() 触发逻辑
      //   2. 断言 loggerMock.log 被调用过 1 次：
      //      expect(loggerMock.log).toHaveBeenCalledTimes(1)
      //   3. 断言它被调用时传的参数：
      //      expect(loggerMock.log).toHaveBeenCalledWith('Hello World!')
      //
      // 这两步断言就是 "Mock 的灵魂" ——
      // 它让你能验证 *AppService 跟 LoggerService 的协作契约*，
      // 而不只是验证 AppService 的返回值。
      service.getHello();
      expect(loggerMock.log).toHaveBeenCalledTimes(1);
      expect(loggerMock.log).toHaveBeenCalledWith('Hello World!');
    });
  });
});
