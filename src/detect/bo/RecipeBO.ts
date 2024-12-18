const path = require('path');
import {
  DetectCfg,
  DetectType,
  LightType,
  Location,
  PatternCfg,
} from './types';

const mockConfig = {
  designValue: {
    maxRow: 715,
    maxCol: 715,
    chipNum: 1,
  },
  motorZ: 70,
  detectExposureTime: 15_000,
  locationL: {
    motorCoor: [50, 50],
  },
  locationR: {
    motorCoor: [100, 100],
  },
  mapParams: [
    -23.814633352512605, 0, 2324.8582496584995, 0, 23.804746876961232,
    -930.7080318438426, 0, 0, 1,
  ],
  rectifyParams: [
    1.000001001877541, 0, -0.0004724222292509239, 0, 1.0000010019284673,
    0.0006768340244889259, 0, 0, 1,
  ],
  chipList: [
    0.16670243346758823, 0.14292144593974596, 0.7620682672804033,
    0.8570638522485828,
  ],
  patterns: [
    {
      id: 1,
      name: '同轴',
      lightType: 'COAXIAL',
      enableAnomaly: true,
      enableMeasure: true,
      modelFile: '20241016_test1.huanguang.db',
      anomaly: 0.7,
      ignores: [0],
    },
    // {
    //   id: 2,
    //   name: '环光',
    //   lightType: 'RING',
    //   enableAnomaly: true,
    //   enableMeasure: false,
    // },
  ],
  roiDotList: [
    20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30,
    30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20, 30, 30, 20, 20,
    30, 30, 20, 20, 30, 30,
  ],
  chipMeasureX: [-1.5, 1.5],
  chipMeasureY: [-1.5, 1.5],
  chipMeasureR: [-1.5, 1.5],
  roiCornerMotor: [
    97.62309649051184, 39.097581530875374, 67.59953956054554, 69.13360770067247,
    -0.0031858581209718295, 0.006539127039388859,
  ],
  measureChipModelFile: 'chip1.ncc',
  measurePadModelFile: 'pad1.ncc',
  mapImgPath: 'map.png',
};

export class RecipeBO {
  public readonly recipePath: string;
  // 检测配置序列
  public readonly detectCfgSeq: DetectCfg[];
  // Z轴对焦位置
  public readonly motorZ: number;
  // 检测曝光值
  public readonly detectExposureTime: number;
  // 纠偏定位点
  public readonly locationL: Location;
  public readonly locationR: Location;
  // 拍照点位坐标
  public readonly dotList: number[];
  public readonly totalDotNum: number;
  // 检测参数
  public readonly origRectifyParams: RectifyParams;
  public readonly mappingParams: MappingParams;
  // 物料信息
  public readonly maxRow: number;
  public readonly maxCol: number;
  public readonly chipNum: number;
  // die中chip大小及位置
  public readonly chipSize: number[];
  // 检测屏蔽区
  public readonly shildImgPath: string;
  // 测量值宽容范围
  public readonly chipMeasureX: number[];
  public readonly chipMeasureY: number[];
  public readonly chipMeasureR: number[];

  public readonly roiCornerPoint: number[];
  public readonly measureChipModelFile: string;
  public readonly measurePadModelFile: string;

  constructor(
    public readonly id: number,
    public readonly name: string,
    public readonly baseRecipePath: string,
    private readonly config: string,
  ) {
    this.recipePath = path.join(baseRecipePath, `${this.id}.${this.name}`);
    const params = this.parse();
    for (const item in params) {
      this[item] = params[item];
    }
  }

  private parse() {
    // TODO 从真实配置中解析数据
    const config = JSON.parse(this.config);
    // const config = mockConfig;

    const detectCfgSeq = this.patternCfgToDetectCfg(config.patterns);

    const motorZ = config.motorZ;

    const detectExposureTime = config.detectExposureTime;

    const locationL = config.locationL;
    const locationR = config.locationR;

    const dotList = config.roiDotList;
    const totalDotNum = dotList.length / 2;

    const origRectifyParams = config.rectifyParams;
    const mappingParams = config.mapParams;

    const maxRow = config.designValue.maxRow;
    const maxCol = config.designValue.maxCol;
    const chipNum = config.designValue.chipNum;

    const chipSize = config.chipList;

    const shildImgPath = path.join(this.recipePath, config.mapImgPath);

    const chipMeasureX = config.chipMeasureX;
    const chipMeasureY = config.chipMeasureY;
    const chipMeasureR = config.chipMeasureR;

    const roiCornerPoint = config.roiCornerMotor;
    const measureChipModelFile =
      config.measureChipModelFile
        .split(',')
        .filter((item) => item !== '')
        .map((item) => path.join(this.recipePath, item))
        .join(';') + ';';
    const measurePadModelFile =
      config.measurePadModelFile
        .split(',')
        .filter((item) => item !== '')
        .map((item) => path.join(this.recipePath, item))
        .join(';') + ';';

    return {
      detectCfgSeq,
      motorZ,
      detectExposureTime,
      locationL,
      locationR,
      dotList,
      totalDotNum,
      origRectifyParams,
      mappingParams,
      maxRow,
      maxCol,
      chipNum,
      chipSize,
      shildImgPath,
      chipMeasureX,
      chipMeasureY,
      chipMeasureR,
      roiCornerPoint,
      measureChipModelFile,
      measurePadModelFile,
    };
  }

  private patternCfgToDetectCfg(patternCfgList: PatternCfg[]): DetectCfg[] {
    const detectCfgSeq = [];
    for (const patternCfg of patternCfgList) {
      const detectCfg = { detectTypeList: [] };
      detectCfg['patternId'] = patternCfg['id'];
      detectCfg['name'] = patternCfg['name'];
      detectCfg['lightType'] =
        patternCfg['lightType'] === 'COAXIAL'
          ? LightType.COAXIAL
          : patternCfg['lightType'] === 'RING'
            ? LightType.RING
            : patternCfg['lightType'] === 'COAXIAL_RING'
              ? LightType.COAXIAL_RING
              : null;
      if (patternCfg['enableAnomaly'])
        detectCfg['detectTypeList'].push(DetectType.ANOMALY);
      if (patternCfg['enableMeasure'])
        detectCfg['detectTypeList'].push(DetectType.MEASURE);
      detectCfg['modelFile'] = patternCfg['modelFile'] ?? null;
      detectCfg['anomaly'] = patternCfg['anomaly'] ?? null;
      detectCfg['ignores'] = patternCfg['ignores'] ?? null;
      detectCfgSeq.push(detectCfg);
    }
    return detectCfgSeq;
  }
}
