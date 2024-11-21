import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { UserService } from './user.service';
import { User } from './user.entity';
import HttpResponse from 'src/utils/api_res';
import { LoginParam } from './user.param';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  async findAll(): Promise<HttpResponse<User[]>> {
    return HttpResponse.ok(await this.userService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<HttpResponse<User>> {
    return HttpResponse.ok(await this.userService.findById(id));
  }

  @Post()
  async create(@Body() createUser: Partial<User>): Promise<HttpResponse<User>> {
    return HttpResponse.ok(await this.userService.create(createUser));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateUser: Partial<User>,
  ): Promise<HttpResponse<User>> {
    return HttpResponse.ok(await this.userService.update(id, updateUser));
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.userService.delete(id));
  }

  @Post('login')
  async login(@Body() loginParam: LoginParam) {
    try {
      return HttpResponse.ok(await this.userService.login(loginParam));
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }
}
