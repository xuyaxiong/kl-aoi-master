const assert = require('assert');
import { ImagePtr } from 'src/camera/camera.bo';

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
