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
import { saveImagePtrSync } from '../../utils/image_utils';
import Utils from '../../utils/Utils';

export class DetectInfoQueue {
  private imgCnt = 0;
  private posQueue: ReportPos[] = [];
  private imagePtrQueue: ImagePtr[] = [];
  public readonly imageInfoMap = new Map<number, ImageInfo>();
  public readonly imgCntPerLightType = new Map<number, number>();

  constructor(
    private detectCfgLoop: DetectCfg[],
    private outputPath: string,
  ) {
    detectCfgLoop.forEach((detectCfg) => {
      this.imgCntPerLightType.set(detectCfg.lightType, 0);
    });
  }

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
      const lightName = detectCfg.name;
      const patternId = detectCfg.patternId;
      const detectTypeList = detectCfg.detectTypeList;
      const ignores = detectCfg.ignores;
      const anomalyThreshold = detectCfg.anomaly;
      const modelFile = detectCfg.modelFile;
      const pos = this.posQueue.shift();
      const imagePtr = this.imagePtrQueue.shift();
      assert(pos !== undefined, '坐标不能为空');
      assert(imagePtr !== undefined, '图片不能为空');
      const origImgCntPerLightType = this.imgCntPerLightType.get(lightType);
      this.imgCntPerLightType.set(lightType, origImgCntPerLightType + 1);
      this.imgCnt += 1;
      // 缓存图片指针，数据合并完成后截取缺陷小图用
      this.imageInfoMap.set(imagePtr.frameId, { imagePtr, reportPos: pos });
      const imgName = `${imagePtr.frameId}_${pos.x}_${pos.y}.jpg`;
      let maskPath = path.join(this.outputPath, 'imgs', 'mask');
      Utils.ensurePathSync(maskPath);
      maskPath = path.join(maskPath, imgName);
      const dir = path.join(this.outputPath, 'imgs', `${idx}.${lightName}`);
      const fullpath = saveImagePtrSync(imagePtr, dir, imgName);
      // console.log(`保存图片至: ${fullpath}`);
      const tmpDetectInfoList = [];
      for (const detectType of detectTypeList) {
        tmpDetectInfoList.push({
          pointIdx,
          pos,
          lightType,
          imagePtr,
          detectType,
          patternId,
          cntPerLightType: this.imgCntPerLightType.get(lightType),
          imgPath: fullpath,
          maskPath,
          ignores,
          anomalyThreshold,
          modelFile,
        });
      }
      return tmpDetectInfoList;
    }
    return null;
  }
}
