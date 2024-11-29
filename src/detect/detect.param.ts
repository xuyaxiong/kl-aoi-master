import { ImageSize } from 'src/camera/camera.bo';
import { ShieldInfo } from './bo';

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
  padModelPath: string;
  chipNum: number;
  chipSize: number[];
  roiCornerPoint: number[];
  detectRegionSize: number[];
  measureThreshold: number;
  postProcess: Boolean;
}

export interface AnomalyParam {
  fno: number;
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
