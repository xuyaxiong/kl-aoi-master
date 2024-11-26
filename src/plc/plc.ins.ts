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
    return [1, 2];
  }
}

@Timeout(1_000)
export class CapPosIns extends SyncIns {
  public static readonly NAME = '下发拍照点位列表指令';
  public static readonly MOD_NUM = 4;
  public static readonly INS_NUM = 3;

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

export class SwitchModeIns extends Ins {
  public static readonly NAME = '切换PLC手动/自动模式指令';
  public static readonly MOD_NUM = 4;
  public static readonly INS_NUM = 7;

  constructor(private mode: number) {
    super();
  }

  protected getPayload(): number[] {
    return [0, this.mode];
  }
}

@Timeout(50_000)
export class InitPlcIns extends SyncIns {
  public static readonly NAME = '初始化PLC指令';
  public static readonly MOD_NUM = 4;
  public static readonly INS_NUM = 8;

  protected getPayload(): number[] {
    const payload = [];
    payload.push(this._sendNo);
    return payload;
  }

  public parseRespData(data: number[] | Buffer): any {
    return getPayloadFromResp(data);
  }
}

@Timeout(50_000)
export class StartPlcIns extends SyncIns {
  public static readonly NAME = '启动PLC指令';
  public static readonly MOD_NUM = 4;
  public static readonly INS_NUM = 9;

  protected getPayload(): number[] {
    const payload = [];
    payload.push(this._sendNo);
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
