const path = require('path');
import * as os from 'os';
import KLBuffer from 'kl-buffer';
import * as dayjs from 'dayjs';
const _ = require('lodash');
const assert = require('assert');
const fs = require('fs');
import Utils from './Utils';
import { Image, ImagePtr } from '../camera/camera.bo';
import shmemDll from '../wrapper/shmem';
import rectifyDll from '../wrapper/rectify';
import { CapPos } from '../plc/plc.bo';
import '../extension';

export function loadImage(
  path: string,
  width: number,
  height: number,
  channel: number,
): Image {
  const buffer = Buffer.alloc(width * height * channel);
  shmemDll.imread(path, buffer, width, height, channel, true);
  return {
    buffer,
    width,
    height,
    channel,
  };
}

// 缓存本地加载图片
const localImgCache = new Map();
export function loadImagePtr(
  path: string,
  width: number,
  height: number,
  channel: number,
  fno: number,
) {
  const img = loadImage(path, width, height, channel);
  localImgCache.set(Symbol(), img.buffer);
  const klBuffer = KLBuffer.alloc(width * height * channel, img.buffer);
  const imagePtr: ImagePtr = new ImagePtr(
    [klBuffer.ptrVal, klBuffer.size],
    width,
    height,
    channel,
    fno,
  );
  return imagePtr;
}

export function saveImagePtrSync(
  imagePtr: ImagePtr,
  dir: string,
  name: string,
): string {
  const { buffer } = new KLBuffer(imagePtr.bufferPtr[1], imagePtr.bufferPtr[0]);
  return saveImageSync(
    {
      buffer,
      width: imagePtr.width,
      height: imagePtr.height,
      channel: imagePtr.channel,
    },
    dir,
    name,
  );
}

export function saveTmpImagePtr(imagePtr: ImagePtr, dir: string = null) {
  const tmpDir = dir || path.join(os.tmpdir(), 'koalaTmp');
  const imgName = `tmp-${Utils.genRandomStr(10)}.jpg`;
  return saveImagePtrSync(imagePtr, tmpDir, imgName);
}

export function saveImageSync(image: Image, dir: string, name: string): string {
  const { buffer, width, height, channel } = image;
  return _saveImageSync(buffer, width, height, channel, dir, name);
}

export function saveImage(image: Image, dir: string, name: string): string {
  const { buffer, width, height, channel } = image;
  return _saveImage(buffer, width, height, channel, dir, name);
}

export function saveTmpImage(image: Image, dir: string = null) {
  const tmpDir = dir || path.join(os.tmpdir(), 'koalaTmp');
  const imgName = `tmp-${dayjs().format('YYYYMMDDHHmmssSSS')}.png`;
  saveImage(image, tmpDir, imgName);
  return path.join(tmpDir, imgName);
}

function _saveImageSync(
  buffer: Buffer,
  width: number,
  height: number,
  channel: number,
  dir: string,
  name: string,
): string {
  const fullPath = path.join(dir, name);
  Utils.ensurePathSync(dir);
  shmemDll.imwrite(fullPath, buffer, width, height, channel, true);
  return fullPath;
}

function _saveImage(
  buffer: Buffer,
  width: number,
  height: number,
  channel: number,
  dir: string,
  name: string,
): string {
  const fullPath = path.join(dir, name);
  Utils.ensurePathSync(dir);
  shmemDll.imwrite.async(
    fullPath,
    buffer,
    width,
    height,
    channel,
    true,
    () => {},
  );
  return fullPath;
}

export function cropImg(
  imgPtr: ImagePtr,
  left: number,
  top: number,
  cropWidth: number,
  cropHeight: number,
) {
  const { width, height, channel } = imgPtr;
  const imgBuffer = new KLBuffer(imgPtr.bufferPtr[1], imgPtr.bufferPtr[0])
    .buffer;
  const defeatBuffer = Buffer.alloc(cropWidth * cropHeight * channel);
  shmemDll.crop(
    imgBuffer,
    width,
    height,
    left,
    top,
    defeatBuffer,
    cropWidth,
    cropHeight,
    channel,
  );
  return defeatBuffer;
}

export function loadImageAsync(
  path: string,
  width: number,
  height: number,
  channel: number,
): Promise<Image> {
  const buffer = Buffer.alloc(width * height * channel);
  return new Promise((resolve, reject) => {
    shmemDll.imread.async(
      path,
      buffer,
      width,
      height,
      channel,
      true,
      (err, retVal) => {
        resolve({
          buffer,
          width,
          height,
          channel,
        });
      },
    );
  });
}

// 拼全图
export async function saveFullImg(
  width: number,
  height: number,
  channel: number,
  uniqueName: string,
  lensParams: number[],
  baseDir: string,
  imgDir: string,
  dataOutputPath: string,
  unit = 5, // unit越小生成的全景图越大
  imgType: 'jpg' | 'png',
) {
  console.log('开始拼图');
  const imgNameBuf = uniqueName.toBuffer();
  const res1 = rectifyDll.initMosaic(
    imgNameBuf,
    unit,
    lensParams.doubleToBuffer(),
  );
  assert.equal(res1, 0, '调用initMosaic失败');
  const dirPath = path.join(baseDir, imgDir);
  const fileList = fs
    .readdirSync(dirPath)
    .filter((file) => file.endsWith('.jpg'));
  const posList = fileList.map((file) => parseImgName(file));

  const filePosList = _.zipWith(fileList, posList, (file, pos) => {
    return { file, pos };
  });
  const totalImgNum = filePosList.length;
  const batch_size = 50;
  const filePosBatchArr = _.chunk(filePosList, batch_size);
  for (let i = 0; i < filePosBatchArr.length; ++i) {
    const batch = filePosBatchArr[i];
    const posArr = batch.map((item) => item.pos);
    const fileArr = batch.map((item) => item.file);
    const loadFilePromiseList = fileArr.map((file) => {
      const fullPath = `${dirPath}/${file}`;
      return loadImageAsync(fullPath, width, height, channel);
    });
    const imgArr = await Promise.all(loadFilePromiseList);
    const imgPosBatch = _.zipWith(imgArr, posArr, (img, pos) => {
      return { image: img, pos };
    });
    for (const [index, { image, pos }] of imgPosBatch.entries()) {
      console.log(`update ${i * batch_size + (index + 1)}/${totalImgNum}...`);
      const res2 = rectifyDll.updateMosaic(
        imgNameBuf,
        image.buffer,
        image.height,
        image.width,
        image.channel,
        [pos.x, pos.y].doubleToBuffer(),
      );
      assert.equal(res2, 0, '调用updateMosaic失败');
    }
  }
  Utils.ensurePathSync(dataOutputPath);
  const outputPath = path.join(dataOutputPath, `full_img_${unit}.${imgType}`);
  const res3 = rectifyDll.saveMosaic(imgNameBuf, outputPath.toBuffer(), true);
  assert.equal(res3, 0, '调用saveMosaic失败');
  const res4 = rectifyDll.freeMosaic(imgNameBuf);
  assert.equal(res4, 0, '调用freeMosaic失败');
  console.log(`拼图完成: ${outputPath}`);
  return outputPath;
}

// 1_204.3885040283203_215.08619689941406.png
const IMG_NAME_REG = /\d+_(-?\d+(\.\d+)?)_(-?\d+(\.\d+)?).[jpg|png]/;
function parseImgName(imgName: string): CapPos {
  const res = imgName.match(IMG_NAME_REG);
  const x = parseFloat(res[1]);
  const y = parseFloat(res[3]);
  return { x, y };
}
