const assert = require('assert');
const path = require('path');
import { ImagePtr } from '../../camera/camera.bo';
import {
  DetectCfg,
  DetectInfo,
  ImageInfo,
  LightType,
  ReportPos,
} from './types';
import { saveImagePtr } from '../../utils/image_utils';

export class DetectInfoQueue {
  private imgCnt = 0;
  private posQueue: ReportPos[] = [];
  private imagePtrQueue: ImagePtr[] = [];
  public readonly imageInfoMap = new Map<number, ImageInfo>();

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
      this.imageInfoMap.set(imagePtr.frameId, { imagePtr, reportPos: pos });
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
