const assert = require('assert');
const chalk = require('chalk');
import * as dayjs from 'dayjs';
const path = require('path');
import { ImagePtr } from 'src/camera/camera.bo';
import { CapPos } from 'src/plc/plc.bo';

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

  constructor(private detectCfgLoop: DetectCfg[]) {}

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
      const detectTypeList = detectCfg.detectTypeList;
      this.imgCnt += 1;
      const pos = this.posQueue.shift();
      const imagePtr = this.imagePtrQueue.shift();
      assert(pos !== undefined, '坐标不能为空');
      assert(imagePtr !== undefined, '图片不能为空');
      const tmpDetectInfoList = [];
      for (const detectType of detectTypeList) {
        tmpDetectInfoList.push({
          pointIdx,
          pos,
          lightType: detectCfg.lightType,
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

  constructor(
    private totalImgCnt: number,
    private totalDetectCnt: number,
    private totalAnomalyCnt: number,
    private totalMeasureCnt: number,
    private callback?: Function | undefined,
  ) {}

  public plusAnomalyCnt() {
    this.anomaly++;
    this.total++;
    if (this.isDone()) {
      console.log('检测完成');
      this.callback?.();
    }
  }

  public plusMeasureCnt() {
    this.measure++;
    this.total++;
    if (this.isDone()) {
      console.log('检测完成');
      this.callback?.();
    }
  }

  private isDone() {
    return this.total === this.totalDetectCnt;
  }

  public toString(): string {
    return `${chalk.cyan.bold('******************************')}
${chalk.cyan.bold('图片总数')}：${chalk.green.bold(this.totalImgCnt)}
${chalk.cyan.bold('检测总数')}：${chalk.magenta.bold(this.total)}/${chalk.green.bold(this.totalDetectCnt)}
${chalk.cyan.bold('外观总数')}：${chalk.magenta.bold(this.anomaly)}/${chalk.green.bold(this.totalAnomalyCnt)}
${chalk.cyan.bold('测量总数')}：${chalk.magenta.bold(this.measure)}/${chalk.green.bold(this.totalMeasureCnt)}
${chalk.cyan.bold('******************************')}`;
  }
}

export interface MeasureRemoteCfg {
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
  }
}
