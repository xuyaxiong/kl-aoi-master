import { MoveItemInfo } from 'kl-ins';
export interface HomeParam {
  axisList: number[];
}
export interface MoveParam {
  axisInfoList: MoveItemInfo[];
}

export interface GetPosParam {
  axisList: number[];
}

export interface JogStartParam {
  axisNum: number;
  speed: number;
  direction: number;
}

export interface JogStopParam {
  axisNum: number;
}
