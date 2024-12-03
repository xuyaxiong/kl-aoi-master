const xlsx = require('xlsx');
const path = require('path');
const fs = require('fs');
const _ = require('lodash');
const assert = require('assert');
import '../extension';
import Utils from '../utils/Utils';
import {
  AnomalyDataItem,
  AnomalyDefectCapInfo,
  ImageInfo,
  MeasureDataItem,
  MergedDetectData,
  ReportPos,
} from './bo';
import { cropImg, saveImage } from '../utils/image_utils';
import rectifyDll from '../wrapper/rectify';

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

function byteArrToFloat(bytes: number[]): number {
  bytes = bytes.reverse();
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
    const key = `${item.R}-${item.C}-${item.chipId}`;
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
    ...formattedData.map((item) => [item.R, item.C, item.chipId, item.types]),
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
  imageInfoMap: Map<number, ImageInfo>,
  anomalyDefectCapInfoList: AnomalyDefectCapInfo[],
  savePath: string,
) {
  for await (const capInfo of anomalyDefectCapInfoList) {
    const imgInfo = imageInfoMap.get(capInfo.fno);
    const { R, C, chipId, type, left, top, width, height } = capInfo;
    const imgBuf = cropImg(imgInfo.imagePtr, left, top, width, height);
    const randomStr = Utils.genRandomStr(5);
    const imgName = `${R}_${C}_${chipId}_${type}_${randomStr}.jpg`;
    saveImage({ buffer: imgBuf, width, height, channel: 3 }, savePath, imgName);
  }
}

// 需要根据测量结果(dx, dy, dr)过滤
export function filtrateMeasureDefect(
  measureDataItemList: MeasureDataItem[],
  chipMeasureX: number[],
  chipMeasureY: number[],
  chipMeasureR: number[],
) {
  return measureDataItemList.filter((item) => {
    const dx = item[4];
    const dy = item[5];
    const dr = item[6];
    return (
      dx < chipMeasureX[0] ||
      dx > chipMeasureX[1] ||
      dy < chipMeasureY[0] ||
      dy > chipMeasureY[1] ||
      dr < chipMeasureR[0] ||
      dr > chipMeasureR[1]
    );
  });
}

// 截取测量缺陷小图
export async function capMeasureDefectImgs(
  imageInfoMap: Map<number, ImageInfo>,
  measureDefectDataItemList: MeasureDataItem[],
  lensParams: LensParams,
  mappingParams: MappingParams,
  rectifyParams: RectifyParams,
  chipSize: number[],
  savePath: string,
) {
  for (const item of measureDefectDataItemList) {
    const [fno, R, C, chipId, dx, dy, dr] = item;
    const { imagePtr, reportPos } = imageInfoMap.get(fno);
    const [left, top, width, height] = getChipCoors(
      R,
      C,
      chipId,
      [reportPos.x, reportPos.y],
      lensParams,
      rectifyParams,
      mappingParams,
      chipSize,
    );
    const imgBuf = cropImg(imagePtr, left, top, width, height);
    const randomStr = Utils.genRandomStr(5);
    const imgName = `${R}_${C}_${chipId}_${randomStr}.jpg`;
    saveImage({ buffer: imgBuf, width, height, channel: 3 }, savePath, imgName);
  }
}

// 根据行列信息获取截图区域 [left, top, width, height]
export function getChipCoors(
  R: number,
  C: number,
  chipId: number,
  pos: number[],
  lensParams: number[],
  rectifyParams: number[],
  mappingParams: number[],
  chipSize: number[],
) {
  const buf = Buffer.alloc(4 * 8);
  rectifyDll.getChipCoors(
    C,
    R,
    chipId,
    pos.doubleToBuffer(),
    lensParams.doubleToBuffer(),
    rectifyParams.doubleToBuffer(),
    mappingParams.doubleToBuffer(),
    chipSize.doubleToBuffer(),
    buf,
  );
  // 返回值为左上、右下两个点坐标
  const [p1_x, p1_y, p2_x, p2_y] = buf.toDoubleArr();
  return [p1_x, p1_y, p2_x - p1_x, p2_y - p1_y];
}

function transformInvWorldCenter(
  worldCoor: number[],
  lensParams: LensParams,
  rectifyParams: RectifyParams,
) {
  const worldCoorBuf = worldCoor.doubleToBuffer();
  const lensParamsBuf = lensParams.doubleToBuffer();
  const rectifyParamsBuf = rectifyParams.doubleToBuffer();
  const motorPosBuf = Buffer.alloc(2 * 8);
  const retVal = rectifyDll.transformInvWorldCenter(
    1,
    worldCoorBuf,
    lensParamsBuf,
    rectifyParamsBuf,
    motorPosBuf,
  );
  assert.equal(retVal, 0, 'transformInvBiaxialCenter失败');
  return motorPosBuf.toDoubleArr();
}

// 点位列表坐标转换
export function transOrigDotListToCapPosList(
  origDotList: number[],
  lensParams: LensParams,
  rectifyParams: RectifyParams,
) {
  return _.chunk(origDotList, 2).map((dotItem) => {
    const newPos = transformInvWorldCenter(dotItem, lensParams, rectifyParams);
    return { x: newPos[0], y: newPos[1] };
  });
}

export function mergeAnomalyAndMeasureData(
  maxRow: number,
  maxCol: number,
  chipNum: number,
  anomalyDataList: AnomalyDataItem[],
  measureDataList: MeasureDataItem[],
): MergedDetectData[] {
  let grid = [];
  for (let r = 0; r < maxRow; ++r) {
    const row = [];
    for (let c = 0; c < maxCol; ++c) {
      row.push({ R: r, C: c, chipList: [] });
      for (let id = 0; id < chipNum; ++id) {
        row[c].chipList.push({ types: '', dx: 0, dy: 0, dr: 0 });
      }
    }
    grid.push(row);
  }

  for (let anomalyData of anomalyDataList) {
    const { R, C, chipId, types } = anomalyData;
    grid[R][C].chipList[chipId].types = types;
  }
  for (let measureData of measureDataList) {
    const [fno, R, C, chipId, dx, dy, dr] = measureData;
    grid[R][C].chipList[chipId].dx = dx;
    grid[R][C].chipList[chipId].dy = dy;
    grid[R][C].chipList[chipId].dr = dr;
  }

  grid = grid.flat();
  return grid;
}

export function exportMergedDataList(
  dir: string,
  mergedDataList: MergedDetectData[],
  limit: number = 200_000,
) {
  const header = 'R,C,ID,types,dx,dy,dr\n';
  let rows: string[] = [header];
  let count = 0;
  let fileIndex = 0;

  const writeToFile = () => {
    if (rows.length > 1) {
      // 如果有数据需要写入
      const fullPath = path.join(dir, `output_${fileIndex}.csv`);
      console.log('导出合并数据:', fullPath);
      fs.writeFileSync(fullPath, rows.join(''));
      rows = [header]; // 重置行数据，保留表头
      fileIndex++;
    }
  };

  for (const mergedData of mergedDataList) {
    const { R, C, chipList } = mergedData;
    for (const [idx, chip] of chipList.entries()) {
      // ! 导出时R、C、chipId从1开始
      rows.push(
        `${R + 1},${C + 1},${idx + 1},${chip.types},${chip.dx},${chip.dy},${chip.dr}\n`,
      );
      count++;
      if (count >= limit) {
        writeToFile();
        count = 0;
      }
    }
  }

  writeToFile(); // 写入最后的剩余数据
}
