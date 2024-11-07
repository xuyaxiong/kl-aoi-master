import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
const _ = require('lodash');
import axios from 'axios';
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
  MaterialBO,
  MeasureRemoteCfg,
  RecipeBO,
  ReportPos,
} from './detect.bo';
import { MeasureParam, StartParam } from './detect.param';
import { RecipeService } from 'src/db/recipe/recipe.service';
import { CapPos } from 'src/plc/plc.bo';

enum DetectStatus {
  IDLE,
  CORRECTION_ONE,
  CORRECTION_TWO,
  DETECTING,
}

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);
  private detectInfoQueue: DetectInfoQueue;
  private detectCfgSeq: DetectCfg[];
  private detectedCounter: DetectedCounter;
  private totalImgCnt: number;
  private totalDetectCnt: number;
  private totalAnomalyCnt: number;
  private totalMeasureCnt: number;
  private currImgCnt: number;
  private anomalyResult: any[];
  private measureResult: MeasureData[];
  private materialBO: MaterialBO;
  private measureRemoteCfg: MeasureRemoteCfg;
  private detectStatus: DetectStatus = DetectStatus.IDLE;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly cameraService: CameraService,
    private readonly recipeService: RecipeService,
  ) {
    this.measureRemoteCfg =
      this.configService.get<MeasureRemoteCfg>('measureRemoteCfg');
    this.detectCfgSeq = this.configService.get<DetectCfg[]>('detectCfgSeq');
    console.log('detectCfgSeq =', this.detectCfgSeq);
    this.setReportDataHandler();
  }

  public async start(startParam: StartParam) {
    const { sn, recipeId } = startParam;
    this.cameraService.setGrabMode('external'); // 相机设置为外触发模式
    this.materialBO = await this.initMaterialBO(sn, recipeId);
    console.log(this.materialBO);
    this.detectInfoQueue = new DetectInfoQueue(this.detectCfgSeq);
    this.anomalyRawList = [];
    this.measureResList = [];
    const totalPointCnt = this.materialBO.recipeBO.totalDotNum;
    const detectCount = this.calcDetectCount(this.detectCfgSeq, totalPointCnt);
    this.totalImgCnt = detectCount.totalImgCnt;
    this.totalDetectCnt = detectCount.totalDetectCnt;
    this.totalAnomalyCnt = detectCount.totalAnomalyCnt;
    this.totalMeasureCnt = detectCount.totalMeasureCnt;
    this.currImgCnt = 0;
    this.logger.warn(`******************************`);
    this.logger.warn(`总点位数：${totalPointCnt}`);
    this.logger.warn(`总图片数：${this.totalImgCnt}`);
    this.logger.warn(`总检测数：${this.totalDetectCnt}`);
    this.logger.warn(`总外观数：${this.totalAnomalyCnt}`);
    this.logger.warn(`总测量数：${this.totalMeasureCnt}`);
    this.logger.warn(`******************************`);
    this.detectedCounter = new DetectedCounter(
      this.totalImgCnt,
      this.totalDetectCnt,
      this.totalAnomalyCnt,
      this.totalMeasureCnt,
      () => {
        // 原始测量结果去重
        const dedupMeasureDataList = removeDupMeasureDataList(
          this.measureResult,
        );
        console.log(dedupMeasureDataList);
      },
    );
    this.eventEmitter.emit(`startCorrection`);
  }

  private anomalyRawList: number[][];
  private measureResList: number[][];
  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr) {
    if (this.detectStatus === DetectStatus.CORRECTION_ONE) {
      // 1.3. 获取纠偏点位1图片
      const img1Ptr = imagePtr;
      // 1.4. 获取纠偏点位1坐标
      const pos1 = await this.getCurrPos();
      // 1.5. 运动至纠偏点位2
      await this.moveToXY(this.materialBO.recipeBO.correctionPos2);
      // 2. 切换到纠偏2状态
      this.detectStatus = DetectStatus.CORRECTION_TWO;
      // 2.1. 触发拍照
      this.plcService.takePhoto();
    } else if (this.detectStatus === DetectStatus.CORRECTION_TWO) {
      // 2.2. 获取纠偏点位2图片
      const img2Ptr = imagePtr;
      // 2.3. 获取纠偏点位2坐标
      const pos2 = await this.getCurrPos();
      // TODO 2.4. 调用纠偏接口
      const correctionXY = { x: 0, y: 0 };
      // 2.5. 执行纠偏运动
      await this.moveToXY(correctionXY);
      // 3. 切换到检测状态
      this.detectStatus = DetectStatus.DETECTING;
      // 3.1. 下发拍照点位
      await this.plcService.capPos({
        capPosList: this.materialBO.recipeBO.dotList,
        sliceSize: 100,
      });
    } else if (this.detectStatus === DetectStatus.DETECTING) {
      this.currImgCnt += 1;
      console.log('当前收到图片数量：', this.currImgCnt);
      this.detectInfoQueue.addImagePtr(imagePtr);
      this.detectInfoQueue.addPos({ idx: 0, x: 99, y: 100 });
      // const imagePath = saveTmpImagePtr(imagePtr);
      // console.log(imagePath);
      while (!this.detectInfoQueue.isEmpty()) {
        const detectInfoList = this.detectInfoQueue.shift();
        // console.log('detectInfoList =', detectInfoList);
        for (const detectInfo of detectInfoList) {
          const { pointIdx, pos, imagePtr, lightType, detectType } = detectInfo;
          this.logger.verbose(
            `点位：${pointIdx}
光源类型：${lightType === LightType.COAXIAL ? '同轴' : '环光'}
检测类型：${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
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
          console.log(this.detectedCounter.toString());
          // console.log('anomalyRawList =', this.anomalyRawList);
          // console.log('measureResList =', this.measureResList);
        }
      }
    }
  }

  private setReportDataHandler() {
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

  private async initMaterialBO(sn: string, recipeId: number) {
    const recipe = await this.recipeService.findById(recipeId);
    const recipeBO = new RecipeBO(recipeId, recipe.name, recipe.config);
    return new MaterialBO(sn, recipeBO);
  }

  @OnEvent('startCorrection')
  private async correctionTrigger() {
    // 1. 切换到纠偏1状态
    this.detectStatus = DetectStatus.CORRECTION_ONE;
    // 1.1. 运动至纠偏点位1
    await this.moveToXY(this.materialBO.recipeBO.correctionPos1);
    // 1.2. 触发拍照
    await this.plcService.takePhoto();
  }

  private async moveToXY(coor: CapPos) {
    const moveParam = {
      axisInfoList: [
        {
          axisNum: 1,
          speed: 100,
          dest: coor.x,
          isRelative: false,
        },
        {
          axisNum: 2,
          speed: 100,
          dest: coor.y,
          isRelative: false,
        },
      ],
    };
    await this.plcService.move(moveParam);
  }

  private async getCurrPos(): Promise<CapPos> {
    const res = await this.plcService.getPos({ axisList: [1, 2] });
    return { x: res[0].pos, y: res[1].pos };
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
    const imgCntPerPoint = detectCfgSeq.length;
    return {
      totalImgCnt: imgCntPerPoint * totalPointCnt,
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

  public async measureRemote(measureParam: MeasureParam) {
    const measureUrl = `${this.measureRemoteCfg.host}:${this.measureRemoteCfg.port}/measure/measure`;
    try {
      const res = await axios.post(measureUrl, measureParam);
      const data = res.data.data;
      return data;
    } catch (error) {
      console.error('error:', error);
    }
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

// TODO 测量数据合并策略
function calcNewMeasureData(existingData: MeasureData, newData: MeasureData) {
  return newData;
}

function removeDupMeasureDataList(
  measureDataList: MeasureData[],
): MeasureData[] {
  const map = new Map();
  measureDataList.forEach((item) => {
    const key = `${item[0]}-${item[1]}-${item[2]}`;
    if (map.has(key)) {
      const existingItem = map.get(key);
      const finalItem = calcNewMeasureData(existingItem, item);
      map.set(key, finalItem);
    } else {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}
