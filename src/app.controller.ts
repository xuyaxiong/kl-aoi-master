import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service';
import HttpResponse from './utils/api_res';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('/appInfo')
  getAppInfo(): HttpResponse<object> {
    return HttpResponse.ok(this.appService.getAppInfo());
  }

  @Get('/config')
  getConfig(): object {
    return HttpResponse.ok(this.appService.getConfig());
  }
}
