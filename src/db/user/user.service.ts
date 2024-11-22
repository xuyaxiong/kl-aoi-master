import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { LoginParam } from './user.param';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async findAll(): Promise<User[]> {
    const userList = await this.userRepository.find();
    userList.forEach((user) => {
      delete user.password;
    });
    return userList;
  }

  async findById(id: number): Promise<User> {
    const user = await this.userRepository.findOneBy({ id });
    delete user.password;
    return user;
  }

  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }

  async update(id: number, updateUser: Partial<User>): Promise<User> {
    await this.userRepository.update(id, updateUser);
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.userRepository.delete(id);
  }

  async login(loginParam: LoginParam) {
    const user = await this.userRepository.findOneBy({ id: loginParam.id });
    if (!user) throw new Error('无此用户');
    if (user.password !== loginParam.password.trim())
      throw new Error('密码错误');
    if (user.isLock) throw new Error('用户已被锁定');
    return await this.update(user.id, { loginTime: new Date() });
  }
}
