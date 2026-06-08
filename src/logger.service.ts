import { Injectable } from '@nestjs/common';

/**
 * 一个最小化的日志服务，用来演示「Provider 如何被另一个 Provider 注入」。
 *
 * 学习要点：
 * - 这个类自己也用 @Injectable() 标记，因为它要被 Nest 容器管理。
 * - 它没有依赖任何别人，所以构造函数为空。
 * - 把它注册到 AppModule 的 providers 数组后，任何模块内的类都能注入它。
 */
@Injectable()
export class LoggerService {
  // TODO(你来写):
  // 实现一个 log(message: string): void 方法。
  // 要求：
  //   1. 在控制台输出形如 `[2026-06-08T...] [LOG] message` 的内容
  //   2. 使用 console.log（这里先不引入复杂的日志库，专注于 DI 概念）
  //
  // 思考题（写之前想一下）：
  //   - 这个方法是实例方法。AppService 注入 LoggerService 后，
  //     this.logger.log('xxx') 调用的是同一个实例还是新实例？为什么？
  //   - 如果 logger 内部需要一个「日志前缀（如服务名）」，
  //     你会用构造函数参数传，还是用属性？哪种更符合 DI 风格？

  private counter = 0;
  log(message: string): void {
    this.counter++;
    console.log(
      `[${new Date().toISOString()}] [LOG] ${message}, counter: ${this.counter}`,
    );
    console.log(this.counter);
  }
}
