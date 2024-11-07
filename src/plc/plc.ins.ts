const _ = require('lodash');
import { Ins, SyncIns, Timeout } from 'kl-ins';
import { CapPos } from './plc.bo';

export class TakePhotoIns extends Ins {
  public static readonly NAME = '触发相机拍照指令';
  public static readonly MOD_NUM = 4;
  public static readonly INS_NUM = 6;

  constructor() {
    super();
  }

  protected getPayload(): number[] {
    return [];
  }
}

@Timeout(1_000)
export class CapPosIns extends SyncIns {
  public static readonly NAME = '下发拍照点位列表指令';
  public static readonly MODULE_NUM = 4;
  public static readonly NUM = 3;

  private total: number;
  private startIdx: number;
  private capPosList: CapPos[];

  constructor(total: number, startIdx: number, capPosList: CapPos[]) {
    super();
    this.total = total;
    this.startIdx = startIdx;
    this.capPosList = capPosList;
  }
  protected getPayload(): number[] {
    const payload = [];
    payload.push(this._sendNo);
    payload.push(...numToLoHi(this.total));
    payload.push(...numToLoHi(this.startIdx));
    for (const capPos of this.capPosList) {
      payload.push(...floatToByteArr(capPos.x));
      payload.push(...floatToByteArr(capPos.y));
    }
    return payload;
  }
  public parseRespData(data: number[] | Buffer): any {
    return getPayloadFromResp(data);
  }
}

function getPayloadFromResp(data: number[] | Buffer) {
  if (data instanceof Buffer) data = Array.from(data);
  const lenLo = data[2];
  const lenHi = data[3];
  const len = loHiToLen(lenLo, lenHi);
  data = data.slice(0, len);
  data = _.drop(data, 7);
  data = _.dropRight(data, 2);
  return data;
}

function numToLoHi(num: number): number[] {
  return [num % 256, Math.floor(num / 256)];
}

function loHiToLen(lo: number, hi: number): number {
  return lo + hi * 256;
}

function floatToByteArr(num: number): number[] {
  const buffer = new ArrayBuffer(4);
  const view = new DataView(buffer);
  view.setFloat32(0, num);
  return [...new Uint8Array(buffer)].reverse();
}
