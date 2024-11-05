import assert from 'assert';
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
  posIdx: number; // 点位标识，从0计数
  pos: ReportPos;
  image: ImagePtr;
  lightType: LightType;
}

export class DetectInfoQueue {
  private;
  private posIdxCnt = 0;
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
      const posIdx = Math.floor(this.posIdxCnt / this.lightTypeLoop.length);
      const lightType =
        this.lightTypeLoop[this.posIdxCnt % this.lightTypeLoop.length];
      this.posIdxCnt += 1;
      const pos = this.posQueue.shift();
      const image = this.imageQueue.shift();
      assert(pos !== undefined, '坐标为空');
      assert(image !== undefined, '图片为空');
      return { posIdx, pos, lightType, image };
    }
    return null;
  }
}
