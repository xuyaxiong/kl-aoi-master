const path = require('path');
const assert = require('assert');
import { ImagePtr } from '../../camera/camera.bo';
import { CapPos } from '../../plc/plc.bo';
import { saveImagePtrSync } from '../../utils/image_utils';
import rectifyDll from '../../wrapper/rectify';
import waferDll from '../../wrapper/wafer';
import { Location } from './types';
import '../../extension';
import { objToFile } from '../detect.utils';
import KLBuffer from 'kl-buffer';

export class Corrector {
  private pos1: CapPos;
  private pos2: CapPos;
  private imgPtr1: ImagePtr;
  private imgPtr2: ImagePtr;

  constructor(
    private outputPath: string,
    private recipePath: string,
  ) {}

  public setPos1(pos1: CapPos) {
    this.pos1 = pos1;
  }

  public setPos2(pos2: CapPos) {
    this.pos2 = pos2;
  }

  public setImg1(imgPtr1: ImagePtr) {
    this.imgPtr1 = imgPtr1;
  }

  public setImg2(imgPtr2: ImagePtr) {
    this.imgPtr2 = imgPtr2;
  }

  public correct(
    locationL: Location,
    locationR: Location,
    lensParams: LensParams,
    originRectifyParams: RectifyParams,
  ): RectifyParams {
    console.log(this.pos1, this.pos2, this.imgPtr1, this.imgPtr2);
    // 保存纠偏定位图片
    const pos1Name = `${this.imgPtr1.frameId}_${this.pos1.x}_${this.pos1.y}.jpg`;
    const pos2Name = `${this.imgPtr2.frameId}_${this.pos2.x}_${this.pos2.y}.jpg`;
    const dir = path.join(this.outputPath, 'correction');
    saveImagePtrSync(this.imgPtr1, dir, pos1Name);
    saveImagePtrSync(this.imgPtr2, dir, pos2Name);

    // return null;

    const angleBuf = Buffer.alloc(1 * 8);
    const rectifyParamsBuf = KLBuffer.alloc(9 * 8);
    const width = this.imgPtr1.width;
    const height = this.imgPtr1.height;
    const channel = this.imgPtr1.channel;
    const locationLModelFile = path.join(this.recipePath, locationL.modelFile);
    const locationRModelFile = path.join(this.recipePath, locationR.modelFile);
    const tmplLInfo = [0, 0, locationL.tplWidth, locationL.tplHeight];
    const tmplRInfo = [0, 0, locationR.tplWidth, locationR.tplHeight];
    const refCoor = [this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y];
    const motorCoor = [this.pos1.x, this.pos1.y, this.pos2.x, this.pos2.y];
    rectifyParamsBuf.doubleArray = [...originRectifyParams];
    const buffer1 = this.imgPtr1.getBuffer();
    const buffer2 = this.imgPtr2.getBuffer();
    objToFile(
      {
        width,
        height,
        channel,
        locationLModelFile,
        locationRModelFile,
        tmplLInfo,
        tmplRInfo,
        refCoor,
        motorCoor,
        rectifyParams: originRectifyParams,
      },
      dir,
      'correction.json',
    );

    const retVal = rectifyDll.estimateAccuratePositionCoor(
      buffer1,
      buffer2,
      height,
      width,
      channel,
      locationLModelFile.toBuffer(),
      locationRModelFile.toBuffer(),
      tmplLInfo.intToBuffer(),
      tmplRInfo.intToBuffer(),
      motorCoor.doubleToBuffer(),
      lensParams.doubleToBuffer(),
      [0, 0].doubleToBuffer(), // TODO
      refCoor.doubleToBuffer(),
      rectifyParamsBuf.buffer,
      angleBuf,
    );
    // assert.equal(retVal, 0, '调用estimateAccuratePositionCoor失败');
    // 释放纠偏图片内存
    // waferDll.free_img(buffer1);
    // waferDll.free_img(buffer2);
    const newRectifyParams = rectifyParamsBuf.doubleArray;
    console.log(newRectifyParams);
    return newRectifyParams as RectifyParams;
  }
}
