import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import '../extension';
const _ = require('lodash');
import * as KLBuffer from 'kl-buffer';
import waferDll from '../wrapper/wafer';
import { Camera, ImagePtr } from './camera.bo';

@Injectable()
export class CameraService {
  private detectCamType: string;
  private undistortParams: number[];
  private cameraList: Array<Camera> = [];

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {
    this.detectCamType = this.configService.get<string>('detectCamType');
    this.undistortParams = this.configService.get<number[]>('undistortParams');
    this.initCamera();
  }

  private initCamera() {
    const camCount = waferDll.init_camera(this.detectCamType);
    for (let i = 0; i < camCount; ++i) {
      const camera = this.getCamInfoById(i);
      this.cameraList.push(camera);

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

  private async grabbed(imagePtr: ImagePtr) {
    this.eventEmitter.emit(`camera.grabbed`, imagePtr);
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
      console.log('采图帧号：', fno);
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
}
