const path = require('path');
import * as os from 'os';
import * as KLBuffer from 'kl-buffer';
import * as dayjs from 'dayjs';
import Utils from './Utils';
import { Image, ImagePtr } from '../camera/camera.bo';
import shmemDll from '../wrapper/shmem';

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

export function saveImagePtr(
  imagePtr: ImagePtr,
  dir: string,
  name: string,
): string {
  const { buffer } = new KLBuffer(imagePtr.bufferPtr[1], imagePtr.bufferPtr[0]);
  return saveImage(
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
  return saveImagePtr(imagePtr, tmpDir, imgName);
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
