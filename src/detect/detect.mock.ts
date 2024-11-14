import { loadImagePtr } from 'src/utils/image_utils';
import { AnomalyDataItem, MeasureDataItem } from './detect.bo';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { AnomalyParam, MeasureParam } from './detect.param';
import Utils from 'src/utils/Utils';

// 模拟坐标上报
export function mockReportPos() {
  const idx = Math.floor(Math.random() * 1001);
  const x = (Math.random() * 200).toFixed(4);
  const y = (Math.random() * 200).toFixed(4);
  return {
    idx: idx,
    x: parseFloat(x),
    y: parseFloat(y),
  };
}

// 模拟相机出图
export function mockImgSeqGenerator(
  eventEmitter: EventEmitter2,
  imgNum: number,
  delay: number = 1_000,
) {
  const [width, height, channel] = [5120, 5120, 3];
  let fno = 0;
  const handle = setInterval(() => {
    const imgPtr = loadImagePtr(
      'C:\\Users\\xuyax\\Desktop\\test_measure_data\\2_96.40910339355469_40.311100006103516_0.jpg',
      width,
      height,
      channel,
      fno++,
    );
    eventEmitter.emit(`camera.grabbed`, imgPtr);
    if (fno >= imgNum) clearInterval(handle);
  }, delay);
}

// 模拟外观检测
export async function mockAnomaly(
  count: number = 1000,
): Promise<AnomalyDataItem[]> {
  await randomDelay(2000, 3000);
  const data: Array<AnomalyDataItem> = [];
  for (let i = 0; i < count; i++) {
    const randomFno: number = Math.floor(Math.random() * 100) + 1;
    const randomR: number = Math.floor(Math.random() * 100) + 1;
    const randomC: number = Math.floor(Math.random() * 100) + 1;
    const randomId: number = Math.floor(Math.random() * 100) + 1;
    const typesLength: number = Math.floor(Math.random() * 5) + 1;
    const types: number[] = Array.from(
      { length: typesLength },
      () => Math.floor(Math.random() * 100) + 1,
    );
    const item = {
      fno: randomFno,
      R: randomR,
      C: randomC,
      id: randomId,
      types: types,
    };
    data.push(item);
  }
  return data;
}

// 模拟测量
export async function mockMeasure(
  count: number = 1000,
): Promise<MeasureDataItem[]> {
  await randomDelay(1500, 2500);
  const data: Array<MeasureDataItem> = [];
  for (let i = 0; i < count; i++) {
    const arr: Array<number> = [];
    arr.push(Math.floor(Math.random() * 100) + 1);
    for (let j = 0; j < 3; j++) {
      const randomInt: number = Math.floor(Math.random() * 100) + 1;
      arr.push(randomInt);
    }
    for (let j = 0; j < 3; j++) {
      const randomFloat: number = parseFloat(Math.random().toFixed(4));
      arr.push(randomFloat);
    }
    data.push(arr as MeasureDataItem);
  }
  return data;
}

function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise((resolve) => setTimeout(resolve, delay));
}

function mockMeasureParamWrapper() {
  let fno = -1;
  return function () {
    fno++;
    return {
      fno,
      imagePath:
        'C:\\Users\\xuyax\\Desktop\\test_measure_data\\2_96.40910339355469_40.311100006103516_0.jpg',
      imageSize: {
        width: 5120,
        height: 5120,
        channel: 3,
      },
      pos: [96.40910339355469, 40.311100006103516],
      lensParams: [
        2560, 2560, -0.0005041561895677955, -2.624267773850234e-7,
        9.475674094265883e-7, -6.506838968108795e-7, 0.0005042270233878636,
        -2.6541447767978505e-7, -2.1965531138071474e-7, 1.8761998416316002e-7,
        1, 0, 0,
      ],
      mappingParams: [
        -23.814633352512605, 0, 2324.8582496584995, 0, 23.804746876961232,
        -930.7080318438426, 0, 0, 1,
      ],
      rectifyParams: [
        1.000001001877541, 0, -0.0004724222292509239, 0, 1.0000010019284673,
        0.0006768340244889259, 0, 0, 1,
      ],
      modelPath: 'C:\\Users\\xuyax\\Desktop\\test_measure_data\\chip2.ncc;',
      chipNum: 1,
      chipSize: [
        0.16670243346758823, 0.14292144593974596, 0.7620682672804033,
        0.8570638522485828,
      ],
      roiCornerPoint: [
        97.62309649051184, 39.097581530875374, 67.59953956054554,
        69.13360770067247, -0.0031858581209718295, 0.006539127039388859,
      ],
      detectRegionPath:
        'C:\\Users\\xuyax\\Desktop\\test_measure_data\\shield.jpg',
      measureThreshold: 0.7,
      postProcess: false,
    } as MeasureParam;
  };
}

export const mockMeasureParam = mockMeasureParamWrapper();

function mockAnomalyParamWrapper() {
  let fno = -1;
  return function () {
    fno++;
    const imageName = Utils.genRandomStr();
    return {
      fno,
      imageName,
      dbName: '20241016_test1.huanguang.db',
      imagePath:
        'C:\\Users\\xuyax\\Desktop\\test_measure_data\\2_96.40910339355469_40.311100006103516_0.jpg',
      flawCount: 20,
      anomalyThreshold: 0.8,
      ignores: [0],
      isFirst: true,
      pos: [96.40910339355469, 40.311100006103516],
      lensParams: [
        2560, 2560, -0.0005041561895677955, -2.624267773850234e-7,
        9.475674094265883e-7, -6.506838968108795e-7, 0.0005042270233878636,
        -2.6541447767978505e-7, -2.1965531138071474e-7, 1.8761998416316002e-7,
        1, 0, 0,
      ],
      mappingParams: [
        -23.814633352512605, 0, 2324.8582496584995, 0, 23.804746876961232,
        -930.7080318438426, 0, 0, 1,
      ],
      rectifyParams: [
        1.000001001877541, 0, -0.0004724222292509239, 0, 1.0000010019284673,
        0.0006768340244889259, 0, 0, 1,
      ],
      roiCornerPoint: [
        97.62309649051184, 39.097581530875374, 67.59953956054554,
        69.13360770067247, -0.0031858581209718295, 0.006539127039388859,
      ],
      chipNum: 1,
      chipSize: [
        0.16670243346758823, 0.14292144593974596, 0.7620682672804033,
        0.8570638522485828,
      ],
      shildInfo: {
        path: 'C:\\Users\\xuyax\\Desktop\\test_measure_data\\37.20241016_test1\\37.20241016_test1\\map.png',
        col: 715,
        row: 715,
      },
      imageSavePath: `D:\\tmp\\${imageName}.jpg`,
      maskSavePath: `D:\\tmp\\mask_${imageName}.jpg`,
    } as AnomalyParam;
  };
}

export const mockAnomalyParam = mockAnomalyParamWrapper();
