import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import AppConfig from './app.config';

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
    const imgInfo = AppConfig.imgInfo;
    const exportPath = AppConfig.exportPath;
    const retConfig = {
      ...this.configService['internalConfig'],
      ...imgInfo,
      ...exportPath,
    };
    return retConfig;
  }
}
