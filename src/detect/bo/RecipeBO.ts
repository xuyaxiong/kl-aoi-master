import { CapPos } from 'src/plc/plc.bo';

export class RecipeBO {
  public readonly correctionPos1: CapPos;
  public readonly correctionPos2: CapPos;
  public readonly dotList: CapPos[];
  public readonly totalDotNum: number;
  public readonly rectifyParams: RectifyParams;
  public readonly lensParams: LensParams;
  public readonly mappingParams: MappingParams;
  public readonly chipSize: number[];

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
    const config = JSON.parse(this.config);
    // TODO 从真实配置中解析数据
    const correctionPos1 = { x: 50, y: 50 };
    const correctionPos2 = { x: 100, y: 100 };
    const totalDotNum = 10;
    const lensParams = [
      2560, 2560, -0.0005041561895677955, -2.624267773850234e-7,
      9.475674094265883e-7, -6.506838968108795e-7, 0.0005042270233878636,
      -2.6541447767978505e-7, -2.1965531138071474e-7, 1.8761998416316002e-7, 1,
      0, 0,
    ];
    const mappingParams = [
      -23.814633352512605, 0, 2324.8582496584995, 0, 23.804746876961232,
      -930.7080318438426, 0, 0, 1,
    ];
    const rectifyParams = [
      1.000001001877541, 0, -0.0004724222292509239, 0, 1.0000010019284673,
      0.0006768340244889259, 0, 0, 1,
    ];
    const chipSize = [
      0.16670243346758823, 0.14292144593974596, 0.7620682672804033,
      0.8570638522485828,
    ];

    return {
      correctionPos1,
      correctionPos2,
      totalDotNum,
      rectifyParams,
      lensParams,
      mappingParams,
      chipSize,
    };
  }
}
