import KLBuffer from 'kl-buffer';

export interface Camera {
  sn: string;
  model: string;
  width: number;
  height: number;
  channel: number;
  id: number;
}

export interface ImageSize {
  width: number;
  height: number;
  channel: number;
}

export interface Image {
  buffer: Buffer;
  width: number;
  height: number;
  channel: number;
}

export interface ImagePtrLike {
  frameId?: number;
  bufferPtr: any;
  // 图片宽度
  width: number;
  // 图片高度
  height: number;
  // 图片通道
  channel: number;
}

export class ImagePtr {
  readonly bufferPtr: any;
  // 图片宽度
  readonly width: number;
  // 图片高度
  readonly height: number;
  // 图片通道
  readonly channel: number;
  // 图片帧号
  readonly frameId?: number;
  private buffer: Buffer = null;

  constructor(
    bufferPtr,
    width: number,
    height: number,
    channel: number,
    frameId?: number,
  ) {
    this.bufferPtr = bufferPtr;
    this.width = width;
    this.height = height;
    this.channel = channel;
    this.frameId = frameId;
  }

  static from(imagePtrLike: ImagePtrLike) {
    return new ImagePtr(
      imagePtrLike.bufferPtr,
      imagePtrLike.width,
      imagePtrLike.height,
      imagePtrLike.channel,
    );
  }

  getBuffer() {
    if (!this.buffer) {
      const { buffer } = new KLBuffer(this.bufferPtr[1], this.bufferPtr[0]);
      this.buffer = buffer;
    }
    return this.buffer;
  }
}
