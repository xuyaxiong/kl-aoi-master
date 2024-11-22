export interface SetExposureTimeParam {
  expTime: number;
}

export interface UndistortParam {
  undistortParams: number[];
}

export interface UpdateCamCfgParam {
  name: string;
  value: number[];
}
