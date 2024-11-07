import { ImageSize } from 'src/camera/camera.bo';

export interface StartParam {
  sn: string;
  recipeId: number;
}

export interface MeasureParam {
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
