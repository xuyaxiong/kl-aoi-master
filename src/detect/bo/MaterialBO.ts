import * as dayjs from 'dayjs';
const path = require('path');
import { RecipeBO } from './recipeBO';

export class MaterialBO {
  private static BASE_MATERIAL_OUTPUT_PATH = 'D:\\kl-storage\\record';
  private static BASE_CUSTOMER_OUTPUT_PATH = 'D:\\kl-storage\\data';

  public readonly id: string;
  public readonly startTime: Date;
  public readonly outputPath: string;
  public readonly dataOutputPath: string;
  public readonly detectParamPath: string;
  public readonly anomalyDefectCapImgPath: string;
  public readonly measureDefectCapImgPath: string;

  constructor(
    private readonly sn: string,
    public readonly recipeBO: RecipeBO,
  ) {
    this.id = dayjs().format('YYYYMMDDHHmmss');
    const nowDate = dayjs(Date.now()).format('YYYYMMDD');
    this.outputPath = path.join(
      MaterialBO.BASE_MATERIAL_OUTPUT_PATH,
      nowDate,
      this.id,
    );
    this.dataOutputPath = path.join(
      MaterialBO.BASE_CUSTOMER_OUTPUT_PATH,
      nowDate,
      this.recipeBO.name,
      this.sn,
      this.id,
    );
    this.anomalyDefectCapImgPath = path.join(
      this.dataOutputPath,
      'DEFECT_IMGS',
      'ANOMALY',
    );
    this.measureDefectCapImgPath = path.join(
      this.dataOutputPath,
      'DEFECT_IMGS',
      'MEASURE',
    );
    this.detectParamPath = path.join(this.outputPath, 'detectParams');
  }
}
