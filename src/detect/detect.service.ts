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
import {
  DetectCfg,
  DetectedCounter,
  DetectInfoQueue,
  DetectType,
  LightType,
  ReportPos,
} from './detect.bo';

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);
  private detectInfoQueue: DetectInfoQueue;
  private detectCfgSeq: DetectCfg[];
  private detectedCounter: DetectedCounter;
  private totalDetectCnt: number;
  private totalAnomalyCnt: number;
  private totalMeasureCnt: number;
  private anomalyResult: any[];
  private measureResult: any[];

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly cameraService: CameraService,
  ) {
    this.detectCfgSeq = this.configService.get<DetectCfg[]>('detectCfgSeq');
    console.log('detectCfgSeq =', this.detectCfgSeq);
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

    this.start(); // TODO 测试用
  }

  public start() {
    this.cameraService.setGrabMode('external'); // 相机设置为外触发模式
    this.detectInfoQueue = new DetectInfoQueue(this.detectCfgSeq);
    this.anomalyRawList = [];
    this.measureResList = [];
    const totalPointCnt = 3; // 拍摄总点位数，外部传入
    const detectCount = this.calcDetectCount(this.detectCfgSeq, totalPointCnt);
    this.totalDetectCnt = detectCount.totalDetectCnt;
    this.totalAnomalyCnt = detectCount.totalAnomalyCnt;
    this.totalMeasureCnt = detectCount.totalMeasureCnt;
    this.logger.log(`总点位数：${totalPointCnt}`);
    this.logger.log(`总检测数：${this.totalDetectCnt}`);
    this.logger.log(`总外观检测数：${this.totalAnomalyCnt}`);
    this.logger.log(`总测量数：${this.totalMeasureCnt}`);
    this.detectedCounter = new DetectedCounter(
      this.totalDetectCnt,
      this.totalAnomalyCnt,
      this.totalMeasureCnt,
    );
  }

  private anomalyRawList: number[][];
  private measureResList: number[][];
  // private totalDetectedCnt = 0;
  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr) {
    this.detectInfoQueue.addImagePtr(imagePtr);
    this.detectInfoQueue.addPos({ idx: 0, x: 99, y: 100 });
    // const imagePath = saveTmpImagePtr(imagePtr);
    // console.log(imagePath);
    while (!this.detectInfoQueue.isEmpty()) {
      const detectInfoList = this.detectInfoQueue.shift();
      console.log('detectInfoList =', detectInfoList);
      for (const detectInfo of detectInfoList) {
        const { pointIdx, pos, imagePtr, lightType, detectType } = detectInfo;
        this.logger.verbose(
          `点位：${pointIdx}，光源类型：${lightType === LightType.COAXIAL ? '同轴' : '环光'}，检测类型：${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
        );
        if (detectType === DetectType.ANOMALY) {
          // 送外观检测
          const anomalyRes = await this.mockAnomaly();
          this.anomalyRawList.push(...anomalyRes);
          this.detectedCounter.plusAnomalyCnt();
        } else if (detectType === DetectType.MEASURE) {
          // 送测量
          const measureRes = await this.mockMeasure();
          this.measureResList.push(...measureRes);
          this.detectedCounter.plusMeasureCnt();
        }
        console.log('detectedCounter =', this.detectedCounter.toString());
        console.log('anomalyRawList =', this.anomalyRawList);
        console.log('measureResList =', this.measureResList);
      }
    }
  }

  private calcDetectCount(detectCfgSeq: DetectCfg[], totalPointCnt: number) {
    const detectCntPerPoint = detectCfgSeq
      .map((detectCfg) => detectCfg.detectTypeList.length)
      .reduce((acc, curr) => acc + curr, 0);
    const anomalyCntPerPoint = detectCfgSeq
      .map(
        (detectCfg) =>
          detectCfg.detectTypeList.filter(
            (detectType) => detectType === DetectType.ANOMALY,
          ).length,
      )
      .reduce((acc, curr) => acc + curr, 0);
    const measureCntPerPoint = detectCfgSeq
      .map(
        (detectCfg) =>
          detectCfg.detectTypeList.filter(
            (detectType) => detectType === DetectType.MEASURE,
          ).length,
      )
      .reduce((acc, curr) => acc + curr, 0);
    return {
      totalDetectCnt: detectCntPerPoint * totalPointCnt,
      totalAnomalyCnt: anomalyCntPerPoint * totalPointCnt,
      totalMeasureCnt: measureCntPerPoint * totalPointCnt,
    };
  }

  private async mockAnomaly() {
    await randomDelay(2000, 3000);
    return [
      [1, 2, 3, 4, 5, 6],
      [6, 5, 4, 3, 2, 1],
    ];
  }

  private async mockMeasure() {
    await randomDelay(1500, 2500);
    return [
      [1, 2, 3, 4, 5, 6],
      [6, 5, 4, 3, 2, 1],
    ];
  }
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
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
