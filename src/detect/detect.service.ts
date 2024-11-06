import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
const _ = require('lodash');
import '../extension';
import { ImagePtr } from 'src/camera/camera.bo';
import { PlcService } from 'src/plc/plc.service';
import { ReportData } from 'kl-ins';
import { CameraService } from './../camera/camera.service';
import { saveTmpImagePtr } from 'src/utils/image_utils';
import { DetectInfoQueue, DetectType, LightType, ReportPos } from './detect.bo';

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);
  private detectInfoQueue: DetectInfoQueue;
  private anomalyResult: any[];
  private measureResult: any[];

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly cameraService: CameraService,
  ) {
    this.plcService.setReportDataHandler(async (reportData: ReportData) => {
      const { modNum, insNum, data } = reportData;
      console.log(reportData);
      // 处理数据上报
      if (modNum === 4 && insNum === 4) {
        // 拍摄点位坐标
        const reportPos = parseReportPos(data);
        console.log(reportPos);
        this.detectInfoQueue.addPos(reportPos);
      }
    });
  }

  public start() {
    this.cameraService.setGrabMode('external'); // 相机设置为外触发模式
    this.detectInfoQueue = new DetectInfoQueue([
      {
        lightType: LightType.COAXIAL,
        detectTypeList: [DetectType.ANOMALY, DetectType.MEASURE],
      },
      {
        lightType: LightType.RING,
        detectTypeList: [DetectType.ANOMALY],
      },
    ]);
  }

  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr) {
    this.detectInfoQueue.addImagePtr(imagePtr);
    this.detectInfoQueue.addPos({ idx: 0, x: 99, y: 100 });
    // const imagePath = saveTmpImagePtr(imagePtr);
    // console.log(imagePath);
    while (!this.detectInfoQueue.isEmpty()) {
      const detectInfoList = this.detectInfoQueue.shift();
      console.log(detectInfoList);
      for (const detectInfo of detectInfoList) {
        const { pointIdx, pos, imagePtr, lightType, detectType } = detectInfo;
        this.logger.verbose(
          `点位：${pointIdx}，光源类型：${lightType === LightType.COAXIAL ? '同轴' : '环光'}，检测类型：${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
        );
        if (detectType === DetectType.ANOMALY) {
          // 送外观检测
        } else if (detectType === DetectType.MEASURE) {
          // 送测量
        }
      }
    }
  }
}

function parseReportPos(posDataArr: number[]): ReportPos {
  posDataArr = _.drop(posDataArr, 6);
  posDataArr = _.dropRight(posDataArr, 2);
  const idx = posDataArr[0] + posDataArr[1] * 256;
  const x = byteArrToFloat(_.slice(posDataArr, 2, 6));
  const y = byteArrToFloat(_.slice(posDataArr, 6, 10));
  return { idx, x, y };
}

function byteArrToFloat(bytes: number[]): number {
  const buffer = new Uint8Array(bytes).buffer;
  const view = new DataView(buffer);
  return view.getFloat32(0, false);
}
