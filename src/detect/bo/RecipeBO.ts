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
    chipNum: 3,
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
    },
    // {
    //   id: 2,
    //   name: '环光',
    //   lightType: 'RING',
    //   enableAnomaly: true,
    //   enableMeasure: false,
    // },
  ],
  roiDotList: [20, 20, 30, 30],
  chipMeasureX: [-1.5, 1.5],
  chipMeasureY: [-1.5, 1.5],
  chipMeasureR: [-1.5, 1.5],
};

export class RecipeBO {
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
  public readonly rectifyParams: RectifyParams;
  public readonly mappingParams: MappingParams;
  // 物料信息
  public readonly maxRow: number;
  public readonly maxCol: number;
  public readonly chipNum: number;
  // die中chip大小及位置
  public readonly chipSize: number[];
  // 测量值宽容范围
  public readonly chipMeasureX: number[];
  public readonly chipMeasureY: number[];
  public readonly chipMeasureR: number[];

  constructor(
    public readonly id: number,
    public readonly name: string,
    private readonly config: string,
  ) {
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

    const rectifyParams = config.rectifyParams;
    const mappingParams = config.mapParams;

    const maxRow = config.designValue.maxRow;
    const maxCol = config.designValue.maxCol;
    const chipNum = config.designValue.chipNum;

    const chipSize = config.chipList;

    const chipMeasureX = config.chipMeasureX;
    const chipMeasureY = config.chipMeasureY;
    const chipMeasureR = config.chipMeasureR;

    return {
      detectCfgSeq,
      motorZ,
      detectExposureTime,
      locationL,
      locationR,
      dotList,
      totalDotNum,
      rectifyParams,
      mappingParams,
      maxRow,
      maxCol,
      chipNum,
      chipSize,
      chipMeasureX,
      chipMeasureY,
      chipMeasureR,
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
