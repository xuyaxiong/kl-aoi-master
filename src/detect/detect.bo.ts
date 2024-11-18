const assert = require('assert');
const chalk = require('chalk');
import * as dayjs from 'dayjs';
const path = require('path');
import { ImagePtr } from 'src/camera/camera.bo';
import { CapPos } from 'src/plc/plc.bo';
import { saveImagePtr } from 'src/utils/image_utils';
import Utils from 'src/utils/Utils';

export enum DetectType {
  ANOMALY, // 外观
  MEASURE, // 测量
}

export enum LightType {
  COAXIAL,
  RING,
}

export interface ReportPos {
  idx: number;
  x: number;
  y: number;
}

export interface DetectInfo {
  pointIdx: number; // 点位标识，从0计数
  pos: ReportPos;
  imagePtr: ImagePtr;
  lightType: LightType;
  detectType: DetectType;
}

export interface DetectCfg {
  lightType: LightType;
  detectTypeList: DetectType[];
}

export class DetectInfoQueue {
  private imgCnt = 0;
  private posQueue: ReportPos[] = [];
  private imagePtrQueue: ImagePtr[] = [];
  public readonly imagePtrMap = new Map<number, ImagePtr>();

  constructor(
    private detectCfgLoop: DetectCfg[],
    private outputPath: string,
  ) {}

  public addPos(reportPos: ReportPos) {
    this.posQueue.push(reportPos);
  }

  public addImagePtr(imagePtr: ImagePtr) {
    this.imagePtrQueue.push(imagePtr);
  }

  public isEmpty(): boolean {
    return this.posQueue.length === 0 || this.imagePtrQueue.length === 0;
  }

  public shift(): DetectInfo[] {
    if (this.posQueue.length > 0 && this.imagePtrQueue.length > 0) {
      const pointIdx = Math.floor(this.imgCnt / this.detectCfgLoop.length);
      const idx = this.imgCnt % this.detectCfgLoop.length;
      const detectCfg = this.detectCfgLoop[idx];
      const lightType = detectCfg.lightType;
      const detectTypeList = detectCfg.detectTypeList;
      this.imgCnt += 1;
      const pos = this.posQueue.shift();
      const imagePtr = this.imagePtrQueue.shift();
      assert(pos !== undefined, '坐标不能为空');
      assert(imagePtr !== undefined, '图片不能为空');
      // 缓存图片指针，数据合并完成后截取缺陷小图用
      this.imagePtrMap.set(imagePtr.frameId, imagePtr);
      // TODO 此处保存图片
      let lightName = '';
      if (lightType === LightType.COAXIAL) {
        lightName = '同轴';
      } else if (lightType === LightType.RING) {
        lightName = '环光';
      } else {
        throw new Error('不存在该类型光源');
      }
      const imgName = `${imagePtr.frameId}_${pos.x}_${pos.y}.jpg`;
      const dir = path.join(this.outputPath, 'imgs', `${idx}.${lightName}`);
      const fullpath = saveImagePtr(imagePtr, dir, imgName);
      console.log(`保存图片至: ${fullpath}`);
      const tmpDetectInfoList = [];
      for (const detectType of detectTypeList) {
        tmpDetectInfoList.push({
          pointIdx,
          pos,
          lightType,
          imagePtr,
          detectType,
        });
      }
      return tmpDetectInfoList;
    }
    return null;
  }
}

export class DetectedCounter {
  private total: number = 0;
  private anomaly: number = 0;
  private measure: number = 0;
  private startTime = Date.now();

  constructor(
    private totalPointCnt: number,
    private totalImgCnt: number,
    private totalDetectCnt: number,
    private totalAnomalyCnt: number,
    private totalMeasureCnt: number,
    private callback?: Function | undefined,
  ) {}

  public plusAnomalyCnt() {
    this.anomaly++;
    this.total++;
    console.log(this.toString());
    if (this.isDone()) {
      this.afterDetectDone();
    }
  }

  public plusMeasureCnt() {
    this.measure++;
    this.total++;
    console.log(this.toString());
    if (this.isDone()) {
      this.afterDetectDone();
    }
  }

  private isDone() {
    return this.total === this.totalDetectCnt;
  }

  private afterDetectDone() {
    Utils.figText('DETECT DONE');
    console.log(`检测耗时: ${(Date.now() - this.startTime) / 1000}s`);
    this.callback?.();
  }

  public toString(): string {
    return `${chalk.cyan.bold('******************************')}
${chalk.cyan.bold('点位总数')}: ${chalk.green.bold(this.totalPointCnt)}
${chalk.cyan.bold('图片总数')}: ${chalk.green.bold(this.totalImgCnt)}
${chalk.cyan.bold('检测总数')}: ${chalk.magenta.bold(this.total)}/${chalk.green.bold(this.totalDetectCnt)}
${chalk.cyan.bold('外观总数')}: ${chalk.magenta.bold(this.anomaly)}/${chalk.green.bold(this.totalAnomalyCnt)}
${chalk.cyan.bold('测量总数')}: ${chalk.magenta.bold(this.measure)}/${chalk.green.bold(this.totalMeasureCnt)}
${chalk.cyan.bold('******************************')}`;
  }
}

export interface MeasureRemoteCfg {
  host: string;
  port: number;
}

export interface AnomalyRemoteCfg {
  host: string;
  port: number;
}

export class RecipeBO {
  public readonly correctionPos1: CapPos;
  public readonly correctionPos2: CapPos;
  public readonly dotList: CapPos[];
  public readonly totalDotNum: number;
  constructor(
    public readonly id: number,
    public readonly name: string,
    private readonly config: string,
  ) {
    const params = this.parse();
    for (const item in params) {
      this[item] = params[item];
    }
  }

  private parse() {
    const config = JSON.parse(this.config);
    // TODO 从真实配置中解析数据
    const correctionPos1 = { x: 50, y: 50 };
    const correctionPos2 = { x: 100, y: 100 };
    const totalDotNum = 50;

    return {
      correctionPos1,
      correctionPos2,
      totalDotNum,
    };
  }
}

export class MaterialBO {
  private static BASE_MATERIAL_OUTPUT_PATH = 'D:\\kl-storage\\record';
  private static BASE_CUSTOMER_OUTPUT_PATH = 'D:\\kl-storage\\data';

  public readonly id: string;
  public readonly startTime: Date;
  public readonly outputPath: string;
  public readonly dataOutputPath: string;
  public readonly detectParamPath: string;
  public readonly anomalyDefectCapImgPath: string;

  constructor(
    private readonly sn: string,
    public readonly recipeBO: RecipeBO,
  ) {
    this.id = dayjs().format('YYYYMMDDHHmmss');
    const nowDate = dayjs(Date.now()).format('YYYYMMDD');
    this.outputPath = path.join(
      MaterialBO.BASE_MATERIAL_OUTPUT_PATH,
      nowDate,
      this.id,
    );
    this.dataOutputPath = path.join(
      MaterialBO.BASE_CUSTOMER_OUTPUT_PATH,
      nowDate,
      this.recipeBO.name,
      this.sn,
      this.id,
    );
    this.anomalyDefectCapImgPath = path.join(
      this.dataOutputPath,
      'DEFECT_IMGS',
      'ANOMALY',
    );
    this.detectParamPath = path.join(this.outputPath, 'detectParams');
  }
}

// [fno, R, C, chipId, dx, dy, dr] 七元组
export type MeasureDataItem = FixedLengthArray<number, 7>;
export interface AnomalyDataItem {
  fno: number;
  R: number;
  C: number;
  id: number;
  types: number[];
}

export interface ShieldInfo {
  path: string;
  col: number;
  row: number;
}

export interface DefectCoor {
  fno: number;
  R: number;
  C: number;
  chipId: number;
}

export interface AnomalyFlawItem {
  fno: number;
  type: number;
  feature: string;
  position: number[];
  coor: DefectCoor;
}

export interface AnomalyRes {
  flawList: AnomalyFlawItem[];
  anomalyList: AnomalyDataItem[];
}

export interface AnomalyDefectCapInfo {
  fno: number;
  R: number;
  C: number;
  chipId: number;
  type: number;
  top: number;
  left: number;
  width: number;
  height: number;
}
