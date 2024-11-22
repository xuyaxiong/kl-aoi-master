import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class AppService {
  constructor(private readonly configService: ConfigService) {}

  getHello(): string {
    return 'Hello World!';
  }

  getAppInfo() {
    return {
      author: 'xu yaxiong',
      mail: 'xyxlindy@163.com',
      company: '成都考拉悠然科技有限公司',
    };
  }

  getConfig() {
    const retConfig = { ...this.configService['internalConfig'] };
    return retConfig;
  }
}
