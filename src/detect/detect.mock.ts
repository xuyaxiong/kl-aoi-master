import { loadImagePtr } from 'src/utils/image_utils';
import { AnomalyDataItem, MeasureDataItem } from './detect.bo';
import { EventEmitter2 } from '@nestjs/event-emitter';

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
    const randomR: number = Math.floor(Math.random() * 100) + 1;
    const randomC: number = Math.floor(Math.random() * 100) + 1;
    const randomId: number = Math.floor(Math.random() * 100) + 1;
    const typesLength: number = Math.floor(Math.random() * 5) + 1;
    const types: number[] = Array.from(
      { length: typesLength },
      () => Math.floor(Math.random() * 100) + 1,
    );
    const item = {
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
