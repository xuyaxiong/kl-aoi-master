const assert = require('assert');
import { ImagePtr } from 'src/camera/camera.bo';

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
  image: ImagePtr;
  lightType: LightType;
}

export class DetectInfoQueue {
  private;
  private imgCnt = 0;
  private posQueue: ReportPos[] = [];
  private imageQueue: ImagePtr[] = [];

  constructor(private lightTypeLoop: LightType[]) {}

  public addPos(reportPos: ReportPos) {
    this.posQueue.push(reportPos);
  }

  public addImage(imagePtr: ImagePtr) {
    this.imageQueue.push(imagePtr);
  }

  public isEmpty(): boolean {
    return this.posQueue.length === 0 || this.imageQueue.length === 0;
  }

  public shift(): DetectInfo {
    if (this.posQueue.length > 0 && this.imageQueue.length > 0) {
      const pointIdx = Math.floor(this.imgCnt / this.lightTypeLoop.length);
      const lightType =
        this.lightTypeLoop[this.imgCnt % this.lightTypeLoop.length];
      this.imgCnt += 1;
      const pos = this.posQueue.shift();
      const image = this.imageQueue.shift();
      assert(pos !== undefined, '坐标不能为空');
      assert(image !== undefined, '图片不能为空');
      return { pointIdx, pos, lightType, image };
    }
    return null;
  }
}
