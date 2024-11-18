const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
import Utils from 'src/utils/Utils';
import {
  AnomalyDataItem,
  AnomalyDefectCapInfo,
  MeasureDataItem,
  ReportPos,
} from './detect.bo';
import { cropImg, saveImage } from 'src/utils/image_utils';
import { ImagePtr } from 'src/camera/camera.bo';

export function objToFile(obj: object, dir: string, name: string) {
  Utils.ensurePathSync(dir);
  fs.appendFile(
    path.join(dir, name),
    `${JSON.stringify(obj, null, 4)}`,
    () => {},
  );
}

export function parseReportPos(posDataArr: number[]): ReportPos {
  posDataArr = _.drop(posDataArr, 6);
  posDataArr = _.dropRight(posDataArr, 2);
  const idx = posDataArr[0] + posDataArr[1] * 256;
  const x = byteArrToFloat(_.slice(posDataArr, 2, 6));
  const y = byteArrToFloat(_.slice(posDataArr, 6, 10));
  return { idx, x, y };
}

export function byteArrToFloat(bytes: number[]): number {
  const buffer = new Uint8Array(bytes).buffer;
  const view = new DataView(buffer);
  return view.getFloat32(0, false);
}

// TODO 测量数据合并策略
function calcNewMeasureData(
  existingData: MeasureDataItem,
  newData: MeasureDataItem,
) {
  return newData;
}

// 测量结果去重
export function deDupMeasureDataList(
  measureDataList: MeasureDataItem[],
): MeasureDataItem[] {
  const map = new Map();
  measureDataList.forEach((item) => {
    const key = `${item[1]}-${item[2]}-${item[3]}`;
    if (map.has(key)) {
      const existingItem = map.get(key);
      const finalItem = calcNewMeasureData(existingItem, item);
      map.set(key, finalItem);
    } else {
      map.set(key, item);
    }
  });
  return Array.from(map.values());
}

// 外观检测结果去重
export function deDupAnomalyDataList(anomalyDataList: AnomalyDataItem[]) {
  const map = new Map();
  anomalyDataList.forEach((item) => {
    const key = `${item.R}-${item.C}-${item.id}`;
    if (map.has(key)) {
      const existingItem = map.get(key);
      item.types.forEach((type) => existingItem.types.add(type));
    } else {
      map.set(key, { ...item, types: new Set(item.types) });
    }
  });
  return Array.from(map.values()).map((item) => ({
    ...item,
    types: Array.from(item.types),
  }));
}

export function exportAnomalyDataList(
  name: string,
  dir: string,
  data: AnomalyDataItem[],
) {
  const formattedData = data.map((item) => ({
    ...item,
    types: item.types.join(','),
  }));

  const sheetData = [
    ['R', 'C', 'ID', 'Types'],
    ...formattedData.map((item) => [item.R, item.C, item.id, item.types]),
  ];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const csvContent = xlsx.write(workbook, { bookType: 'csv', type: 'string' });
  Utils.ensurePathSync(dir);
  const fullPath = path.join(dir, name);
  console.log('导出外观检测数据:', fullPath);
  fs.writeFileSync(fullPath, csvContent);
}

export function exportMeasureDataList(
  name: string,
  dir: string,
  data: MeasureDataItem[],
) {
  const sheetData = [
    ['R', 'C', 'ID', 'dx', 'dy', 'dr'],
    ...data.map((item) => item.slice(1)),
  ];
  const workbook = xlsx.utils.book_new();
  const worksheet = xlsx.utils.aoa_to_sheet(sheetData);
  xlsx.utils.book_append_sheet(workbook, worksheet, 'Sheet1');
  const csvContent = xlsx.write(workbook, { bookType: 'csv', type: 'string' });
  Utils.ensurePathSync(dir);
  const fullPath = path.join(dir, name);
  console.log('导出测量数据:', fullPath);
  fs.writeFileSync(fullPath, csvContent);
}

// 截取外观缺陷小图
export async function capAnomalyDefectImgs(
  imagePtrMap: Map<number, ImagePtr>,
  anomalyDefectCapInfoList: AnomalyDefectCapInfo[],
  savePath: string,
) {
  for await (const capInfo of anomalyDefectCapInfoList) {
    const imgPtr = imagePtrMap.get(capInfo.fno);
    const { R, C, chipId, type, left, top, width, height } = capInfo;
    const imgBuf = cropImg(imgPtr, left, top, width, height);
    const randomStr = Utils.genRandomStr(5);
    const imgName = `${R}_${C}_${chipId}_${type}_${randomStr}.jpg`;
    saveImage({ buffer: imgBuf, width, height, channel: 3 }, savePath, imgName);
  }
}
