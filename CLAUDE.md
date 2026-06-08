# hello_nest — CLAUDE.md

> 项目级 AI 指令（Claude Code / 其他 AI 工具读这一份就够）

## 项目定位

这是一个 **NestJS 学习项目**，不是生产代码。目的：亲手实现 NestJS 核心机制（DI、模块化、DTO/VO、验证、安全防御），对比多种生态选型（class-validator vs zod）。

## 架构概览

**单进程 NestJS 11 + pnpm**，默认底层 Express。两套验证系统在**同一个应用里共存**：

| 模块 | 验证方案 | Pipe 挂载 | DTO 风格 | VO 风格 |
|---|---|---|---|---|
| `users/` | **class-validator** | `UsersController` 局部 `@UsePipes(new ValidationPipe({...}))` | 装饰器（`@IsEmail`） | `@Exclude()` + `@Expose()` |
| `books/` | **zod 4 + nestjs-zod 5.4** | **参数级** `@Body(new ZodValidationPipe(schema))` | `z.object({...})` | `@Exclude()` + `@Expose()` |
| `app.controller` + `logger` | class-validator 副产物 | 演示 DI 三层链 Controller → Service → Logger | — | — |

**这种"两套共存"是有意保留**——展示企业里"老模块沿旧方案 + 新模块用新方案"的过渡状态。

## 关键技术决策与原因

### 1. 全局只开 `ClassSerializerInterceptor`，**不**全局开 `ValidationPipe`
- 原因：全局 ValidationPipe 会跟 books 局部的 ZodValidationPipe 互相干扰
- 两套 pipe 必须**彻底分离**
- ClassSerializerInterceptor 是全局的（响应序列化两套都用）

### 2. zod 验证用**参数级 pipe**（`@Body(new ZodValidationPipe(schema))`），**不用**方法级 `@UsePipes`
- 原因：方法级 pipe 对所有参数（body、param、query）都跑，会把 string 类型的 URL 参数拿去 zod 验证 → "expected object, received string"
- 用户给的 [NestJS 中文文档](https://docs.nestjs.cn/overview/pipes) 明确演示了"参数级"写法

### 3. ZodValidationPipe **必须**显式传 schema（`new ZodValidationPipe(schema)`），**不**依赖 DTO 上的自动挂载
- 原因：zod 4 + nestjs-zod 5.4 组合下 `createZodDto` 的 schema 自动挂载有兼容 bug
- 参考用户给的中文文档第 3 节"基于模式的验证"示例

### 4. `UpdateBookSchema` 用 `z.object(CreateBookSchema.shape).partial()`，**不**直接 `CreateBookSchema.partial()`
- 原因：zod 4 的 `.partial()` 直接返回的不是 ZodObject 标准形态（_def.typeName 行为有变）
- 显式 `z.object(shape).partial()` 强制得到 ZodObject，避免交互问题

## 关键文件位置

```
src/
├── main.ts                          # 全局 ClassSerializerInterceptor
├── app.module.ts                    # imports: [UsersModule, BooksModule]
├── users/                           # class-validator 派
│   ├── users.controller.ts          # @UsePipes(new ValidationPipe({...})) 局部
│   ├── dto/create-user.dto.ts       # @IsEmail/@MinLength 等装饰器
│   └── vo/user.vo.ts                # @Exclude() 类 + @Expose() 字段
├── books/                           # zod 派
│   ├── books.controller.ts          # @Body(new ZodValidationPipe(schema)) 参数级
│   ├── dto/create-book.dto.ts       # z.object({...}) + .toLowerCase() 等 transform
│   ├── dto/update-book.dto.ts       # z.object(CreateBookSchema.shape).partial()
│   ├── entities/book.entity.ts      # 含 internalNote 敏感字段
│   └── vo/book.vo.ts                # @Exclude() + @Expose() 同 users
├── logger.service.ts                # @Injectable() 演示副产物
└── 两个 .spec.ts                    # jest 单元测试
```

## 常用命令

```bash
pnpm install                # 安装依赖
pnpm start                  # 启动（不 watch）
pnpm start:dev              # 启动 + watch（开发用这个）
pnpm test                   # 跑 jest
pnpm run lint               # ESLint
pnpm run format             # Prettier 自动格式化
pnpm run build              # 编译到 dist/
```

## 端到端测试

启动后用 curl 验证：

```bash
# Books 模块（zod 验证）
curl -X POST http://localhost:3000/books \
  -H 'Content-Type: application/json' \
  -d '{"title":"Clean Code","author":"Robert","isbn":"9780132350884","publishedYear":2008,"pages":464}'

# Users 模块（class-validator 验证）
curl -X POST http://localhost:3000/users \
  -H 'Content-Type: application/json' \
  -d '{"email":"alice@example.com","name":"Alice","password":"secret123"}'
```

## ⚠️ 踩过的坑（重要！避免重复栽进去）

| # | 坑 | 真因 | 教训 |
|---|---|---|---|
| 1 | `pnpm add` 后 IDE 报"Cannot find module" | pnpm 重新 link 延迟 + VSCode TS Server 缓存 | 按 `Ctrl+Shift+P` → `TypeScript: Restart TS Server` |
| 2 | `tsc --noEmit` 跟 IDE 红线不一致 | 两者是不同进程 | **真错误以 `tsc` 为准**，IDE 红线只能参考 |
| 3 | `@UsePipes(ZodValidationPipe)` class 引用失败 | 框架找不到 DI 容器注册，**静默不实例化** | 改用 `new ZodValidationPipe(schema)` 实例 |
| 4 | zod 4 的 `{ error: 'msg' }`（v4 语法） | nestjs-zod 4 跟 zod 3 仍是 `{ message: 'msg' }` | **当前是 zod 4 + nestjs-zod 5.4**，用 `error:` |
| 5 | 全局 ValidationPipe + 局部 ZodValidationPipe 冲突 | 全局 pipe 先跑破坏 zod 期望的 body 格式 | 两套验证必须分离（一个用 users Controller 局部，另一个用 books 参数级） |
| 6 | 方法级 `@UsePipes` PATCH 报"received string" | 方法级 pipe 对所有参数都跑，**string "1" 也被 zod 验证** | 用**参数级** `@Body(new ZodValidationPipe(...))` |
| 7 | `CreateBookSchema.partial()` PATCH 失败 | zod 4 的 .partial() 派生 schema 行为异常 | 用 `z.object(CreateBookSchema.shape).partial()` 显式包一层 |
| 8 | 移除全局 ValidationPipe 后 URL 参数不再转 number | transform: true 是 ValidationPipe 提供的 | URL id 参数加 `@Param('id', ParseIntPipe)` |

## 编辑器配置

- `.editorconfig` —— 跨编辑器缩进协议（2 空格 TS/JS，4 空格 Python）
- `.vscode/settings.json` —— 工作区级 VSCode 设置
- `.vscode/extensions.json` —— 推荐装 `dbaeumer.vscode-eslint` / `esbenp.prettier-vscode` / `editorconfig.editorconfig`

## 命名约定

| 类型 | 命名 | 例 |
|---|---|---|
| 类 | PascalCase | `BookService`, `CreateBookDto` |
| 文件 | kebab-case | `create-book.dto.ts`, `book.vo.ts` |
| 局部变量 / 方法 | camelCase | `findAll`, `appService` |
| 常量 | UPPER_SNAKE | `MAX_TITLE_LENGTH` |
| 文件夹 | 单数（每模块自闭） | `users/`, `books/`, `vo/`, `dto/` |

## 重要外部依赖

- `@nestjs/common` `@nestjs/core` `@nestjs/platform-express` — NestJS 核心
- `class-validator` + `class-transformer` — Users 模块验证 + 全局 VO 序列化
- `zod@4.4.3` + `nestjs-zod@5.4.0` — Books 模块验证（v4 + v5 组合，**不要**混用旧版本）
- `reflect-metadata` + tsconfig 的 `experimentalDecorators` + `emitDecoratorMetadata` — DI 底层机制

## 不做什么 / 避免误解

- ❌ **不要**用 `createZodDto` 期待 DTO 上的 schema 自动挂载（zod 4 + nestjs-zod 5.4 兼容 bug）—— 总是显式 `new ZodValidationPipe(schema)`
- ❌ **不要**用方法级 `@UsePipes` 挂 zod pipe（会污染 param 验证）—— 用参数级
- ❌ **不要**在 main.ts 全局开 ValidationPipe（跟 books 模块冲突）—— ValidationPipe 只能在 UsersController 局部用
- ❌ **不要**给 BooksController 用 controller 级 `@UsePipes`（同样会污染 param）—— 走参数级
- ❌ **不要**用 `interface` 定义 DTO（装饰器只能贴 class）—— DTO 必须是 class
- ❌ **不要**让 Entity 内部字段出现在 API 响应里 —— 走 VO 显式白名单

## 下一步学习方向（路线图）

按推荐顺序：
1. **A. Middleware / Guards / Interceptors 全家桶** —— 请求生命周期 4 大切面
2. **B. 异常处理 + 自定义 ExceptionFilter** —— 统一错误响应
3. **C. 配置管理 `@nestjs/config`** —— 多环境 .env
4. **D. TypeORM / Prisma 接入真实数据库** —— 完整业务落地
5. **E. e2e 测试** —— 完整 CRUD 测试

## 学习资源

- [NestJS 官方中文文档](https://docs.nestjs.cn/) —— 重点看 pipes、validation、serialization
- [zod.dev](https://zod.dev) —— Schema 验证 + 类型推导
- [class-validator](https://github.com/typestack/class-validator) —— 装饰器验证
- [class-transformer](https://github.com/typestack/class-transformer) —— VO 序列化

## AI 协作提示

- 接手新功能前：先读 `src/<feature>/` 整个目录（DTO / VO / Entity / Service / Controller）
- 写 DTO 前：看 `users/dto/create-user.dto.ts` 跟 `books/dto/create-book.dto.ts`，模仿对应风格的字段
- 写 Controller 前：看同模块的另一个路由，模仿装饰器栈
- 调通后：跑 curl 5 个端点（合法/缺字段/格式错/多余字段/正常查询）才算完成
