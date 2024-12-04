import * as dayjs from 'dayjs';
const path = require('path');
import { RecipeBO } from './recipeBO';
import AppConfig from '../../app.config';

export class MaterialBO {
  public readonly id: string;
  public readonly startTime: Date;
  public readonly imgInfo = AppConfig.imgInfo;
  public readonly outputPath: string;
  public readonly dataOutputPath: string;
  public readonly detectParamPath: string;
  public readonly anomalyDefectCapImgPath: string;
  public readonly measureDefectCapImgPath: string;

  private rectifyParams: RectifyParams;

  constructor(
    private readonly sn: string,
    public readonly recipeBO: RecipeBO,
    public readonly lensParams: LensParams,
  ) {
    this.id = dayjs().format('YYYYMMDDHHmmss');
    this.sn = this.id;
    this.startTime = new Date();
    const nowDate = dayjs(this.startTime).format('YYYYMMDD');
    this.rectifyParams = this.recipeBO.origRectifyParams;
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

  public setRectifyParams(rectifyParams: RectifyParams) {
    this.rectifyParams = rectifyParams;
  }

  public getRectifyParams() {
    return this.rectifyParams;
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
      imgInfo: JSON.stringify(this.imgInfo),
      lensParams: JSON.stringify(this.lensParams),
      rectifyParams: JSON.stringify(this.rectifyParams),
    };
  }
}
