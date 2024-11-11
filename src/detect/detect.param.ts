import { ImageSize } from 'src/camera/camera.bo';
import { ShieldInfo } from './detect.bo';

export interface StartParam {
  sn: string;
  recipeId: number;
}

export interface MeasureParam {
  fno: number;
  imagePath: string;
  imageSize: ImageSize;
  pos: Pos;
  lensParams: LensParams;
  mappingParams: MappingParams;
  rectifyParams: RectifyParams;
  modelPath: string;
  chipNum: number;
  chipSize: number[];
  roiCornerPoint: number[];
  detectRegionPath: string;
  measureThreshold: number;
  postProcess: Boolean;
}

export interface AnomalyParam {
  fno: number;
  imageName: string;
  imagePath: string;
  // imageBuf: Buffer;
  dbName: string;
  flawCount: number;
  anomalyThreshold: number;
  ignores: number[];
  isFirst: boolean;
  pos: Pos;
  lensParams: LensParams;
  mappingParams: MappingParams;
  rectifyParams: RectifyParams;
  chipNum: number;
  chipSize: number[];
  roiCornerPoint: number[];
  imageSavePath: string;
  maskSavePath: string;
  shildInfo: ShieldInfo;
}
