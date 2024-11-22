import * as dayjs from 'dayjs';
const path = require('path');
import { RecipeBO } from './recipeBO';
import AppConfig from '../../app.config';

export class MaterialBO {
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
    this.startTime = new Date();
    const nowDate = dayjs(this.startTime).format('YYYYMMDD');
    this.outputPath = path.join(
      AppConfig.BASE_MATERIAL_OUTPUT_PATH,
      nowDate,
      this.id,
    );
    // this.dataOutputPath = path.join(
    //   AppConfig.BASE_CUSTOMER_OUTPUT_PATH,
    //   nowDate,
    //   this.recipeBO.name,
    //   this.sn,
    //   this.id,
    // );
    this.dataOutputPath = this.outputPath;
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

  public mapToMaterial() {
    return {
      id: this.id,
      sn: this.sn,
      recipeId: this.recipeBO.id,
      outputPath: this.outputPath,
      dataOutputPath: this.dataOutputPath,
      startTime: this.startTime,
      endTime: new Date(),
    };
  }
}
