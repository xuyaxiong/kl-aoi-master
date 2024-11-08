import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
import * as KLBuffer from 'kl-buffer';
import { ConfigService } from '@nestjs/config';
const _ = require('lodash');
import axios from 'axios';
import '../extension';
import { ImagePtr } from 'src/camera/camera.bo';
import { PlcService } from 'src/plc/plc.service';
import { ReportData } from 'kl-ins';
import { CameraService } from './../camera/camera.service';
import { loadImage, saveTmpImagePtr } from 'src/utils/image_utils';
import {
  AnomalyDataItem,
  DetectCfg,
  DetectedCounter,
  DetectInfoQueue,
  DetectType,
  LightType,
  MaterialBO,
  MeasureDataItem,
  MeasureRemoteCfg,
  RecipeBO,
  ReportPos,
} from './detect.bo';
import { MeasureParam, StartParam } from './detect.param';
import { RecipeService } from 'src/db/recipe/recipe.service';
import { CapPos } from 'src/plc/plc.bo';
import Utils from 'src/utils/Utils';

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
  private materialBO: MaterialBO;
  private measureRemoteCfg: MeasureRemoteCfg;
  private detectStatus: DetectStatus = DetectStatus.DETECTING;

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
    this.detectInfoQueue = new DetectInfoQueue(
      this.detectCfgSeq,
      this.materialBO.outputPath,
    );
    this.anomalyRawList = [];
    this.measureRawList = [];
    const totalPointCnt = this.materialBO.recipeBO.totalDotNum;
    const detectCount = this.calcDetectCount(this.detectCfgSeq, totalPointCnt);
    this.totalImgCnt = detectCount.totalImgCnt;
    this.totalDetectCnt = detectCount.totalDetectCnt;
    this.totalAnomalyCnt = detectCount.totalAnomalyCnt;
    this.totalMeasureCnt = detectCount.totalMeasureCnt;
    this.currImgCnt = 0;
    this.logger.warn(`******************************`);
    this.logger.warn(`总点位数: ${totalPointCnt}`);
    this.logger.warn(`总图片数: ${this.totalImgCnt}`);
    this.logger.warn(`总检测数: ${this.totalDetectCnt}`);
    this.logger.warn(`总外观数: ${this.totalAnomalyCnt}`);
    this.logger.warn(`总测量数: ${this.totalMeasureCnt}`);
    this.logger.warn(`******************************`);
    this.detectedCounter = new DetectedCounter(
      totalPointCnt,
      this.totalImgCnt,
      this.totalDetectCnt,
      this.totalAnomalyCnt,
      this.totalMeasureCnt,
      () => {
        // 原始测量结果去重
        const dedupMeasureDataList = deDupMeasureDataList(this.measureRawList);
        console.log('去重前测量结果', this.measureRawList.length);
        console.log('去重后测量结果', dedupMeasureDataList.length);
        exportMeasureDataList(
          'measure.csv',
          this.materialBO.dataOutputPath,
          dedupMeasureDataList,
        );
        // 原始外观结果去重
        const dedupAnomalyDataList = deDupAnomalyDataList(this.anomalyRawList);
        console.log('去重前外观结果', this.anomalyRawList.length);
        console.log('去重后外观结果', dedupAnomalyDataList.length);
        exportAnomalyDataList(
          'anomaly.csv',
          this.materialBO.dataOutputPath,
          dedupAnomalyDataList,
        );
      },
    );
    // this.eventEmitter.emit(`startCorrection`);
    this.mockImgSeqGenerator(this.totalImgCnt, 300);
  }

  private anomalyRawList: AnomalyDataItem[];
  private measureRawList: MeasureDataItem[];
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
      this.logger.log(`当前收到图片数量: ${this.currImgCnt}`);
      this.detectInfoQueue.addImagePtr(imagePtr);
      this.detectInfoQueue.addPos(this.mockReportPos()); // TODO 随机坐标
      // const imagePath = saveTmpImagePtr(imagePtr);
      // console.log(imagePath);
      while (!this.detectInfoQueue.isEmpty()) {
        const detectInfoList = this.detectInfoQueue.shift();
        // console.log('detectInfoList =', detectInfoList);
        for (const detectInfo of detectInfoList) {
          const { pointIdx, pos, imagePtr, lightType, detectType } = detectInfo;
          this.logger.log(
            `\n点位: ${pointIdx}
光源类型: ${lightType === LightType.COAXIAL ? '同轴' : '环光'}
检测类型: ${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
          );
          if (detectType === DetectType.ANOMALY) {
            // 送外观检测
            const anomalyRes = await this.mockAnomaly();
            this.anomalyRawList.push(...anomalyRes);
            this.detectedCounter.plusAnomalyCnt();
          } else if (detectType === DetectType.MEASURE) {
            // 送测量
            const measureRes = await this.mockMeasure();
            this.measureRawList.push(...measureRes);
            this.detectedCounter.plusMeasureCnt();
          }
          // console.log('anomalyRawList =', this.anomalyRawList);
          // console.log('measureResList =', this.measureResList);
        }
      }
    }
  }

  // 模拟相机出图
  private mockImgSeqGenerator(imgNum: number, delay: number = 1_000) {
    const [width, height, channel] = [5120, 5120, 3];
    let fno = 0;
    const handle = setInterval(() => {
      const imgPtr = loadImgPtr(
        'C:\\Users\\xuyax\\Desktop\\test_measure_data\\2_96.40910339355469_40.311100006103516_0.jpg',
        width,
        height,
        channel,
        fno++,
      );
      this.eventEmitter.emit(`camera.grabbed`, imgPtr);
      if (fno >= imgNum) clearInterval(handle);
    }, delay);
  }

  // 处理上报数据
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

  // 运动到该位置
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

  // 获取当前坐标
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

  // 模拟外观检测
  private async mockAnomaly(count: number = 1000): Promise<AnomalyDataItem[]> {
    await randomDelay(2000, 3000);
    const data: Array<AnomalyDataItem> = [];
    for (let i = 0; i < count; i++) {
      const randomR: number = Math.floor(Math.random() * 100) + 1;
      const randomC: number = Math.floor(Math.random() * 100) + 1;
      const randomId: number = Math.floor(Math.random() * 100) + 1;
      const typesLength: number = Math.floor(Math.random() * 5) + 1;
      const types: number[] = Array.from(
        { length: typesLength },
        () => Math.floor(Math.random() * 100) + 1,
      );
      const item = {
        R: randomR,
        C: randomC,
        id: randomId,
        types: types,
      };
      data.push(item);
    }
    return data;
  }

  // 模拟测量
  private async mockMeasure(count: number = 1000): Promise<MeasureDataItem[]> {
    await randomDelay(1500, 2500);
    const data: Array<MeasureDataItem> = [];
    for (let i = 0; i < count; i++) {
      const arr: Array<number> = [];
      for (let j = 0; j < 3; j++) {
        const randomInt: number = Math.floor(Math.random() * 100) + 1;
        arr.push(randomInt);
      }
      for (let j = 0; j < 3; j++) {
        const randomFloat: number = parseFloat(Math.random().toFixed(4));
        arr.push(randomFloat);
      }
      data.push(arr as MeasureDataItem);
    }
    return data;
  }

  // 模拟坐标上报
  private mockReportPos() {
    const idx = Math.floor(Math.random() * 1001);
    const x = (Math.random() * 200).toFixed(4);
    const y = (Math.random() * 200).toFixed(4);
    return {
      idx: idx,
      x: parseFloat(x),
      y: parseFloat(y),
    };
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
function calcNewMeasureData(
  existingData: MeasureDataItem,
  newData: MeasureDataItem,
) {
  return newData;
}

// 测量结果去重
function deDupMeasureDataList(
  measureDataList: MeasureDataItem[],
): MeasureDataItem[] {
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

// 外观检测结果去重
function deDupAnomalyDataList(anomalyDataList: AnomalyDataItem[]) {
  const map = new Map();
  anomalyDataList.forEach((item) => {
    const key = `${item.R}-${item.C}-${item.id}`;
    if (map.has(key)) {
      const existingItem = map.get(key);
      item.types.forEach((type) => existingItem.types.add(type));
    } else {
      map.set(key, { ...item, types: new Set(item.types) });
    }
  });
  return Array.from(map.values()).map((item) => ({
    ...item,
    types: Array.from(item.types),
  }));
}

function loadImgPtr(
  path: string,
  width: number,
  height: number,
  channel: number,
  fno: number,
) {
  const img = loadImage(path, width, height, channel);
  const klBuffer = KLBuffer.alloc(width * height * channel, img.buffer);
  const imagePtr: ImagePtr = new ImagePtr(
    [klBuffer.ptrVal, klBuffer.size],
    width,
    height,
    channel,
    fno,
  );
  return imagePtr;
}

function exportAnomalyDataList(
  name: string,
  dir: string,
  data: AnomalyDataItem[],
) {
  const formattedData = data.map((item) => ({
    ...item,
    types: item.types.join(','),
  }));

  const sheetData = [
    ['R', 'C', 'ID', 'Types'],
    ...formattedData.map((item) => [item.R, item.C, item.id, item.types]),
  ];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const csvContent = xlsx.write(workbook, { bookType: 'csv', type: 'string' });
  Utils.ensurePathSync(dir);
  const fullPath = path.join(dir, name);
  console.log('导出外观检测数据:', fullPath);
  fs.writeFileSync(fullPath, csvContent);
}

function exportMeasureDataList(
  name: string,
  dir: string,
  data: MeasureDataItem[],
) {
  const sheetData = [['R', 'C', 'ID', 'dx', 'dy', 'dr'], ...data];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const csvContent = xlsx.write(workbook, { bookType: 'csv', type: 'string' });
  Utils.ensurePathSync(dir);
  const fullPath = path.join(dir, name);
  console.log('导出测量数据:', fullPath);
  fs.writeFileSync(fullPath, csvContent);
}
