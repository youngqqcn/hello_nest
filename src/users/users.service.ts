import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';

/**
 * 教学版用户服务 —— 用内存数组当存储，不接数据库。
 * 这样你可以专注理解 DTO/VO 的概念，不被 ORM 干扰。
 *
 * 一个真实的 user 对象，注意它有 password 字段（敏感）：
 *   { id: 1, email: 'a@b.com', name: 'Alice', password: 'secret123' }
 */

export interface UserRecord {
  id: number;
  email: string;
  name: string;
  password: string; // 真实项目里会加密存（bcrypt 等），这里简化
}

@Injectable()
export class UsersService {
  private users: UserRecord[] = [];
  private nextId = 1;

  /** 创建新用户，返回完整记录（含 password —— 由 Controller 决定怎么过滤） */
  create(dto: CreateUserDto): UserRecord {
    const user: UserRecord = {
      id: this.nextId++,
      email: dto.email,
      name: dto.name,
      password: dto.password,
    };
    this.users.push(user);
    return user;
  }

  /** 根据 id 查询；找不到抛 NotFoundException（Nest 会自动转 404） */
  findOne(id: number): UserRecord {
    const user = this.users.find((u) => u.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }
}
