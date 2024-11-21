import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import '../extension';
const _ = require('lodash');
import * as KLBuffer from 'kl-buffer';
import waferDll from '../wrapper/wafer';
import { Camera, ImagePtr } from './camera.bo';
import { SysDictService } from '../db/dict/SysDict.service';

@Injectable()
export class CameraService {
  private readonly logger = new Logger(CameraService.name);
  private detectCamType: string;
  private undistortParams: number[];
  private cameraList: Array<Camera> = [];

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly sysDictService: SysDictService,
  ) {
    this.detectCamType = this.configService.get<string>('detectCamType');
    // TODO 从数据库中获取
    this.undistortParams = this.configService.get<number[]>('undistortParams');
    this.initCamera();
  }

  private initCamera() {
    const camCount = waferDll.init_camera(this.detectCamType);
    for (let i = 0; i < camCount; ++i) {
      const camera = this.getCamInfoById(i);
      this.cameraList.push(camera);
      this.logger.verbose(`相机${i}初始化完成`);

      const params = this.undistortParams.doubleToBuffer();
      waferDll.camera_undistort(i, params);
    }
  }

  public getCameraList() {
    return { cameraList: this.cameraList };
  }

  public setGrabMode(mode = 'external') {
    this.cameraList.forEach((_, id) => {
      if (mode === 'external') {
        this.grabExternal(id);
      } else if (mode === 'once') this.grabOnce(id);
      else console.error('please use correct mode.');
    });
  }

  // 根据出图序号纠正出图顺序
  private imagePtrMap = new Map<number, ImagePtr>();
  private expectedFrameNo = 0;
  private async grabbed(imagePtr: ImagePtr) {
    this.imagePtrMap.set(imagePtr.frameId, imagePtr);
    while (this.imagePtrMap.size > 0) {
      const expectedImagePtr = this.imagePtrMap.get(this.expectedFrameNo);
      if (expectedImagePtr) {
        this.imagePtrMap.delete(this.expectedFrameNo);
        this.expectedFrameNo += 1;
        this.eventEmitter.emit(`camera.grabbed`, expectedImagePtr);
      }
    }
  }

  public setExposureTime(camId: number, time: number) {
    waferDll.set_exposure_time(camId, time);
  }

  public getExposureTime(camId: number) {
    const time = Buffer.alloc(4);
    waferDll.get_exposure_time(camId, time);
    return time.readFloatLE();
  }

  public subscribe(name: string) {
    return waferDll.subscribe_backend(name);
  }

  //停止拍照
  public grabStop(camId: number): number {
    return waferDll.grab_stop(camId);
  }

  // 内触发采图
  public grabInternal(id: number) {
    waferDll.grab_internal(id, null, null);
  }

  public grabExternalWithoutCb(id: number) {
    waferDll.grab_external(id, null, null);
  }

  //外触发采图
  private grabExternal(id: number): Promise<ImagePtr> {
    return new Promise(async (resolve, reject) => {
      const callback = await this.getGrabCb(id, null);
      waferDll.grab_external(id, callback, Buffer.alloc(0));
    });
  }

  //拍一次
  public grabOnce(id: number): Promise<ImagePtr> {
    return new Promise(async (resolve, reject) => {
      const callback = await this.getGrabCb(id, resolve);
      waferDll.grab_once(id, callback, Buffer.alloc(0));
    });
  }

  private getGrabCb(id: number, resolve) {
    return waferDll.grabCb((fno, buffer, height, width, channel) => {
      this.logger.verbose(`采图帧号:${fno}`);
      const klBuffer = KLBuffer.alloc(width * height * channel, buffer);
      const imagePtr: ImagePtr = new ImagePtr(
        [klBuffer.ptrVal, klBuffer.size],
        width,
        height,
        channel,
        fno,
      );
      resolve ? resolve(imagePtr) : this.grabbed(imagePtr);
    }, this);
  }

  // 获取相机详情
  private getCamInfoById(id: number): Camera {
    const picHeight = Buffer.alloc(4);
    const picWidth = Buffer.alloc(4);
    const channels = Buffer.alloc(4);
    waferDll.camera_size(id, picHeight, picWidth, channels);
    const width = picWidth.readInt32LE();
    const height = picHeight.readInt32LE();
    const channel = channels.readInt32LE();
    const sn = waferDll.camera_sn(id);
    const model = waferDll.camera_model(id);
    return {
      id,
      sn,
      model,
      width,
      height,
      channel,
    };
  }

  // 查询相机配置
  public async getCamCfg() {
    const camCfgList = await this.sysDictService.getDictItemListByTypeCode({
      typeCode: 'SYS_CAM_CFG',
    });
    const camCfg = {};
    camCfgList.forEach((item) => {
      camCfg[item['code']] = JSON.parse(item['value']);
    });
    return camCfg;
  }
}
