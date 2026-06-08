import { Injectable, NotFoundException } from '@nestjs/common';

interface UserRecord {
  id: number;
  name: string;
  apiKey: string;
}

/**
 * AuthService —— 演示用登录 + 鉴权
 *
 * 内存里硬编码 2 个"用户"（真实项目查 DB）
 *   name  →  apiKey
 *   alice →  demo-key-alice-123
 *   bob   →  demo-key-bob-456
 */
@Injectable()
export class AuthService {
  private readonly users: UserRecord[] = [
    { id: 1, name: 'alice', apiKey: 'demo-key-alice-123' },
    { id: 2, name: 'bob', apiKey: 'demo-key-bob-456' },
  ];

  /** 演示登录：用 name 找 apiKey */
  login(name: string): { id: number; name: string; apiKey: string } {
    const user = this.users.find((u) => u.name === name);
    if (!user) {
      throw new NotFoundException(`User '${name}' not found`);
    }
    return { id: user.id, name: user.name, apiKey: user.apiKey };
  }

  /** 演示根据 apiKey 查 user（AuthGuard 验证通过后调这个） */
  findByApiKey(apiKey: string): UserRecord | undefined {
    return this.users.find((u) => u.apiKey === apiKey);
  }
}
