import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import '../extension';
import { ImagePtr } from 'src/camera/camera.bo';
import { PlcService } from 'src/plc/plc.service';
import { ReportData } from 'kl-ins';

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
  ) {
    this.plcService.setReportDataHandler(async (reportData: ReportData) => {
      // 处理数据上报
      console.log(reportData);
    });
  }

  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr) {
    console.log(imagePtr);
  }
}
