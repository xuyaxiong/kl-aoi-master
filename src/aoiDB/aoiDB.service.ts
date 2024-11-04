import { Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { unlink, access, mkdir, rename } from 'node:fs/promises';
import * as fs from 'fs';
import * as path from 'path';
import * as ref from 'ref-napi';
import {
  DBDataDto,
  CoreLearnDto,
  CropSamplesBySrcDto,
  CropSampleData,
} from './aoiDB.param';
import { ConfigService } from '@nestjs/config';
import shmemDll from '../wrapper/shmem';
import { anomaly1Dll } from '../wrapper/anomaly';

interface sample {
  // 源地址
  src: string;
  // 目标地址
  dist: string;
  // 特征base64
  feature?: string;
}

@Injectable()
export class AOIDBService {
  width: number;
  height: number;
  channel: number;
  dbPath: string;
  constructor(
    public eventEmitter: EventEmitter2,
    private configService: ConfigService,
  ) {
    this.width = this.configService.get<number>('width');
    this.height = this.configService.get<number>('height');
    this.channel = this.configService.get<number>('channel');
    this.dbPath = this.configService.get<string>('dbPath');
  }

  /**
   * defect被删除，需要同时删除其对应db文件中对应的type
   */
  @OnEvent('defect.erase')
  eraseDefect({ id, GPUIndex }) {
    this.findAll().forEach((db) => this.eraseByType(db, id));
  }

  /**
   * 初始化引擎
   */
  initEngine(): boolean {
    const bool = anomaly1Dll.initEngine(
      this.dbPath,
      1,
      this.channel,
      this.height,
      this.width,
      384,
    );
    console.log(bool ? '初始化引擎成功' : '初始化引擎失败');
    return bool;
  }

  /**
   * 初始化引擎
   */
  destroyEngine(): boolean {
    const bool = anomaly1Dll.destroyEngine();
    console.log(bool ? '关闭引擎成功' : '关闭引擎成功');
    return bool;
  }

  /**
   * 查找所有db
   */
  findAll(): string[] {
    let files: string[];
    try {
      files = fs.readdirSync(this.dbPath).filter((e: string) => {
        return e.slice(-3) === '.db' && e.slice(0, 5) != 'temp-';
      });
    } catch (error) {
      console.error(error);
    }
    return files;
  }

  /**
   * 加载DB到内存中，不存在则创建一个新的DB
   * @param db db路径；若父目录不存在，则创建失败；db目录是相对与initEngine给的目录
   * @returns db的条目总数
   */
  load(db: string): Promise<number> {
    return new Promise((resolve) => {
      const count = anomaly1Dll.load_DB(db);
      resolve(count);
    });
  }
  /**
   * 释放DB
   * @param db db路径
   * @returns 此操作是否成功
   */
  public release(db: string): Promise<boolean> {
    return anomaly1Dll.release_DB(db);
  }
  /**
   * 删除db文件
   * @param db db路径
   * @returns 操作是否成功
   */
  async delete(db: string): Promise<boolean> {
    const bool: boolean = anomaly1Dll.release_DB(db);
    try {
      fs.accessSync(this.dbPath + db);
      unlink(this.dbPath + db).then(() => true);
    } catch (error) {}
    return bool ? Promise.resolve(true) : Promise.resolve(false);
  }

  /**
   * 插入数据
   * @param {string} db db路径
   * @param {DBDataDto[]} data 数据列表 [{id,type,feature}]
   * @returns {number} db的条目总数
   */
  public insert(db: string, data: DBDataDto[]): Promise<number> {
    if (!data.length) return Promise.reject(-1);

    const bufferIds = Buffer.from(
      Int32Array.from(data.map((e) => e.id)).buffer,
    );
    const bufferTypes = Buffer.from(
      Int32Array.from(data.map((e) => e.type)).buffer,
    );
    return anomaly1Dll.insert(
      db,
      data.length,
      bufferIds,
      bufferTypes,
      Buffer.concat(
        data.map((e) => Buffer.alloc(384 * 4, e.feature, 'base64')),
      ),
    );
  }

  /**
   * 通过id列表删除数据
   * @param {string} db db路径
   * @param {number[]} ids
   * @returns {number} db的条目总数
   */
  public eraseByIds(db: string, ids: number[]): Promise<number> {
    if (!ids.length) return Promise.reject(-1);
    const bufferIds = Buffer.from(Int32Array.from(ids).buffer);
    return anomaly1Dll.erase(db, ids.length, bufferIds);
  }

  /**
   * 通过类型type删除数据
   * @param {string} db db路径
   * @param {number} type
   * @returns {number} db的条目总数
   */
  public eraseByType(db: string, type: number): Promise<number> {
    return anomaly1Dll.erase_type(db, type);
  }

  /**
   * 更新db
   * @param {string} db db路径
   * @param {number[]} data 更新数据列表 [{id,type}]
   * @returns {boolean} 更新操作是否成功
   */
  public update(db: string, data: DBDataDto[]): Promise<boolean> {
    const bufferIds = Buffer.from(
      Int32Array.from(data.map((e) => e.id)).buffer,
    );
    const bufferTypes = Buffer.from(
      Int32Array.from(data.map((e) => e.type)).buffer,
    );
    return anomaly1Dll.update(
      db,
      data.length,
      bufferIds,
      bufferTypes,
      null, //feature数组
    );
  }

  /**
   * 根据feature查询最近邻的type与score
   * @param {string} db db路径
   * @param {string[]} features
   * @returns {Object} {scores,types,ids}
   */
  async query(db: string, features: string[]): Promise<object> {
    const length = features.length;
    const newFeature = features.map((feature) => {
      return Buffer.alloc(384 * 4, feature, 'base64');
    });
    const bufferFeatures = Buffer.concat(newFeature);

    const bufferScores = Buffer.from(
      Float32Array.from(new Array(length)).buffer,
    );
    const bufferTypes = Buffer.from(Int32Array.from(new Array(length)).buffer);
    const bufferIds = Buffer.from(Int32Array.from(new Array(length)).buffer);
    anomaly1Dll.query(
      db,
      length,
      bufferFeatures,
      bufferScores,
      bufferTypes,
      bufferIds,
    );

    return {
      scores: Array.from(new Float32Array(bufferScores.buffer)),
      ids: Array.from(new Int32Array(bufferIds.buffer)),
      types: Array.from(new Int32Array(bufferTypes.buffer)),
    };
  }

  /**
   * 采集正常图像上的特征向量（一次最多提取1024个特征，若返回特征数量为1024，可再次对该图像采集特征）
   * 此操作会向db写入特征数据与生成对应的sample小图
   * @param {Object} param0
   * @param {string} param0.db db路径
   * @param {string} param0.src 图像地址
   * @param {number} [param0.width] 图像宽
   * @param {number} [param0.height] 图像高
   * @param {number} [param0.channel] 图像通道数；默认值CHANNEL
   * @param {string} [param0.srcMask] 掩膜图像地址
   * @param {number} param0.normalId 正常特征的编号
   * @param {number} param0.threshold 采集特征的阈值
   * @param {number} param0.sampleDir 对应的sample小图的目录
   * @param {number} [param0.featureCount] 一次提取的特征数；默认值1024
   * @param {number} [param0.learnUntilNone] 是否一次性提取所有特征；默认值true
   * @returns {CropSampleData[]} 提取的特征数组 {id,x,y}
   */
  async coreLearn({
    db,
    src,
    width = this.width,
    height = this.height,
    channel = this.channel,
    srcMask,
    normalId,
    threshold,
    sampleDir,
    learnUntilNone = false,
    featureCount = 1024,
  }: CoreLearnDto): Promise<CropSampleData[]> {
    try {
      if (!db || !sampleDir) return;
      // 判断db是否存在，不存则调用load加载
      const dbPath = this.dbPath + db;
      try {
        fs.accessSync(dbPath);
      } catch (error) {
        this.load(db);
      }
      const buffer = Buffer.alloc(width * height * channel);
      const bufferMask = Buffer.alloc(width * height * channel);
      buffer.type = ref.types.uchar;
      bufferMask.type = ref.types.uchar;

      shmemDll.imread(src, buffer, width, height, channel, true);
      console.log('channel', channel);
      if (srcMask) {
        shmemDll.imread(srcMask, bufferMask, width, height, 1, true);
      }

      return this.coreLearnByBuffer({
        db,
        buffer,
        bufferMask: srcMask ? bufferMask : null,
        width,
        height,
        channel,
        normalId,
        threshold,
        sampleDir,
        learnUntilNone,
        featureCount,
      });
    } catch (e) {
      return e;
    }
  }

  /**
   * 采集正常图像上的特征向量（一次最多提取1024个特征，若返回特征数量为1024，可再次对该图像采集特征）
   * 此操作会向db写入特征数据与生成对应的sample小图
   * @param {Object} param0
   * @param {string} param0.db db路径
   * @param {string} param0.buffer 图像buffer
   * @param {string} [param0.bufferMask] 掩膜图像buffer
   * @param {number} [param0.channel] 图像通道数；默认值CHANNEL
   * @param {number} param0.normalId 正常特征的编号
   * @param {number} param0.threshold 采集特征的阈值
   * @param {number} param0.sampleDir 对应的sample小图的目录
   * @param {number} [param0.featureCount] 一次提取的特征数；默认值1024
   * @param {number} [param0.learnUntilNone] 是否一次性提取所有特征；默认值false
   * @returns {CropSampleData[]} 提取的特征数组 {id,x,y}
   */
  async coreLearnByBuffer({
    db,
    buffer,
    width = this.width,
    height = this.height,
    channel = this.channel,
    bufferMask,
    normalId,
    threshold,
    sampleDir,
    learnUntilNone = false,
    featureCount = 1024,
  }): Promise<CropSampleData[]> {
    const ingineWidth = this.width;
    const ingineHeight = this.height;
    buffer = Buffer.from(buffer);

    // 提取的特征
    const features: CropSampleData[] = [];
    const bufferFeatures = Buffer.from(
      Int32Array.from(new Array(featureCount * 3)).buffer,
    );
    let num: number;

    // **提取特征的宽高需与initEngine保持一致！！**
    if (width < ingineWidth || height < ingineHeight) {
      let buffer1 = Buffer.alloc(ingineWidth * ingineHeight * channel);
      shmemDll.paste(
        buffer,
        width,
        height,
        0,
        0,
        buffer1,
        ingineWidth,
        ingineHeight,
        channel,
      );
      [buffer1, buffer] = [buffer, buffer1];

      if (bufferMask) {
        let bufferMask1 = Buffer.alloc(ingineWidth * ingineHeight * channel);
        shmemDll.paste(
          bufferMask,
          width,
          height,
          0,
          0,
          bufferMask1,
          ingineWidth,
          ingineHeight,
          channel,
        );
        [bufferMask1, bufferMask] = [bufferMask, bufferMask1];
      }
    }
    do {
      num = anomaly1Dll.coreLearn(
        db,
        buffer,
        bufferMask,
        ingineHeight,
        ingineWidth,
        channel,
        normalId,
        featureCount,
        threshold,
        bufferFeatures,
      );

      const arr = Array.from(new Int32Array(bufferFeatures.buffer));
      for (let i = 0; i < num; i++) {
        features.push({
          id: arr[3 * i],
          x: arr[3 * i + 1],
          y: arr[3 * i + 2],
        });
      }
    } while (learnUntilNone && num === featureCount);

    this.cropSamples({
      buffer,
      width: ingineWidth,
      height: ingineHeight,
      channel,
      sampleDir,
      data: features,
    });

    return features;
  }

  // todo 移至detect模块
  async featureExtract({
    dist,
    src,
    channel = this.channel,
    width = this.width,
    height = this.height,
    x,
    y,
  }): Promise<object> {
    if (!src || !dist) return;

    const buffer = Buffer.alloc(width * height * channel);
    buffer.type = ref.types.uchar;
    shmemDll.imread(src, buffer, width, height, channel, true);

    x = Math.floor(x / 8) * 8;
    y = Math.floor(y / 8) * 8;
    const cropBuffer = Buffer.alloc(256 * 256 * channel);
    cropBuffer.type = ref.types.uchar;
    shmemDll.crop(
      buffer,
      width,
      height,
      x - 128,
      y - 128,
      cropBuffer,
      256,
      256,
      channel,
    );

    const bufferFeature = Buffer.from(Float32Array.from(new Array(384)).buffer);
    anomaly1Dll.featureExtract(cropBuffer, 256, 256, channel, bufferFeature);
    const dir = path.dirname(dist);
    try {
      await access(dir);
    } catch (e) {
      await mkdir(dir, { recursive: true });
    }

    shmemDll.imwrite(dist, cropBuffer, 256, 256, channel, true);

    return {
      feature: bufferFeature.toString('base64'),
      position: [x - 8, y - 8, 24, 24, x - 128, y - 128, 0],
    };
  }

  /**
   * 裁剪sample小图；小图宽高256*256
   * @param {Object} param0
   * @param {Buffer} param0.buffer 图像buffer
   * @param {number} [param0.channel] 图像通道数；默认值CHANNEL
   * @param {number} param0.width 图像的宽度；*多张物料图被拼接到一块*
   * @param {number} param0.height 图像的高度；*多张物料图被拼接到一块*
   * @param {string[]} param0.sampleDir sample小图的目标地址
   * @param {array[]} param0.data sample小图裁剪相对于src的坐标列表[{id,x,y}]
   * @returns
   */
  private async cropSamples({
    buffer,
    channel = this.channel,
    width = this.width,
    height = this.height,
    sampleDir,
    data,
  }) {
    for (let i = 0; i < data.length; i++) {
      const cropBuffer = Buffer.alloc(256 * 256 * channel);

      shmemDll.crop(
        buffer,
        width,
        height,
        data[i].x,
        data[i].y,
        cropBuffer,
        256,
        256,
        channel,
      );

      await mkdir(sampleDir, { recursive: true });
      shmemDll.imwrite(
        sampleDir + data[i].id + '.png',
        cropBuffer,
        256,
        256,
        channel,
        true,
      );
    }

    return data;
  }

  /**
   * 裁剪sample小图；小图宽高256*256
   * @param {Object} param0
   * @param {Buffer} param0.src 图像src
   * @param {number} [param0.channel] 图像通道数；默认值CHANNEL
   * @param {number} param0.height 图像的高度；*多张物料图被拼接到一块*
   * @param {string[]} param0.sampleDir sample小图的目标地址
   * @param {array[]} param0.data sample小图裁剪相对于src的坐标列表[{id,x,y}]
   * @returns {boolean}
   */
  async cropSamplesBySrc({
    src,
    channel = this.channel,
    width = this.width,
    height = this.height,
    sampleDir,
    data,
  }: CropSamplesBySrcDto): Promise<boolean> {
    if (!src || !sampleDir || !data.length) return false;

    const buffer = Buffer.alloc(width * height * channel);
    buffer.type = ref.types.uchar;

    shmemDll.imread(src, buffer, width, height, channel, true);

    this.cropSamples({
      buffer,
      channel,
      sampleDir,
      width,
      height,
      data,
    });

    return true;
  }

  /**
   * 删除sample小图
   * @param {Object} param0
   * @param {string} db sample小图对应的db
   * @param {string[]} srcs sample小图地址
   * @returns {number} db的条目总数
   */
  async eraseSamples(db: string, srcs: string[]): Promise<number> {
    if (!db || !srcs.length) return Promise.reject(-1);

    const ids = [];
    for (const src of srcs) {
      try {
        await unlink(src);
        ids.push(parseInt(src.split('/').pop()));
      } catch (e) {}
    }

    return this.eraseByIds(db, ids);
  }

  /**
   * 移动sample小图，只能移动到同pattern
   * @param {string[]} db sample小图对应的db
   * @param {object[]} data sample小图的地址 [{src,dist}]
   * @returns {boolean} 是否成功
   */
  async updateSamples(db: string, data: sample[]): Promise<boolean> {
    if (!db || !data.length) return Promise.reject(false);

    const updateData = [];
    for (let i = 0; i < data.length; i++) {
      const { src, dist } = data[i];
      const path = dist.replace(/\\/g, '/').split('/');
      const fileName = path.pop();

      try {
        await mkdir(path.join('/'), { recursive: true });
        await rename(src, dist);
        updateData.push({
          id: parseInt(fileName),
          type: parseInt(path.pop()),
        });
      } catch (e) {
        // console.log(e)
      }
    }

    return this.update(db, updateData);
  }

  /**
   * insertsample小图，同时添加到db
   * @param db sample小图对应的db
   * @param data sample小图的地址与特征 [{src,dist,feature}]
   * @returns db的条目总数
   */
  async insertSamples(db: string, data: sample[]): Promise<number> {
    if (!db || !data.length) return Promise.reject(-1);

    const insertData = [];
    for (let i = 0; i < data.length; i++) {
      const { src, dist, feature } = data[i];
      const path = dist.replace(/\\/g, '/').split('/');
      const fileName = path.pop();

      try {
        await mkdir(path.join('/'), { recursive: true });
        await rename(src, dist);
        insertData.push({
          id: parseInt(fileName),
          type: parseInt(path.pop()),
          feature,
        });
      } catch (e) {
        console.log(e);
      }
    }

    return this.insert(db, insertData);
  }
}
