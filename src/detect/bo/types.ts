import { ImagePtr } from 'src/camera/camera.bo';

export enum DetectType {
  ANOMALY, // 外观
  MEASURE, // 测量
}

export enum LightType {
  COAXIAL,
  RING,
}

export interface ReportPos {
  idx: number;
  x: number;
  y: number;
}

export interface ImageInfo {
  imagePtr: ImagePtr;
  reportPos: ReportPos;
}

export interface DetectInfo {
  pointIdx: number; // 点位标识，从0计数
  pos: ReportPos;
  imagePtr: ImagePtr;
  lightType: LightType;
  detectType: DetectType;
}

export interface DetectCfg {
  lightType: LightType;
  detectTypeList: DetectType[];
}

export interface MeasureRemoteCfg {
  host: string;
  port: number;
}

export interface AnomalyRemoteCfg {
  host: string;
  port: number;
}

// [fno, R, C, chipId, dx, dy, dr] 七元组
export type MeasureDataItem = FixedLengthArray<number, 7>;
export interface AnomalyDataItem {
  fno: number;
  R: number;
  C: number;
  chipId: number;
  types: number[];
}

export interface ShieldInfo {
  path: string;
  col: number;
  row: number;
}

export interface DefectCoor {
  fno: number;
  R: number;
  C: number;
  chipId: number;
}

export interface AnomalyFlawItem {
  fno: number;
  type: number;
  feature: string;
  position: number[];
  coor: DefectCoor;
}

export interface AnomalyRes {
  flawList: AnomalyFlawItem[];
  anomalyList: AnomalyDataItem[];
}

export interface AnomalyDefectCapInfo {
  fno: number;
  R: number;
  C: number;
  chipId: number;
  type: number;
  top: number;
  left: number;
  width: number;
  height: number;
}
