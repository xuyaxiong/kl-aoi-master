const chalk = require('chalk');
import Utils from 'src/utils/Utils';

export class DetectedCounter {
  private total: number = 0;
  private anomaly: number = 0;
  private measure: number = 0;
  private startTime = Date.now();

  constructor(
    private totalPointCnt: number,
    private totalImgCnt: number,
    private totalDetectCnt: number,
    private totalAnomalyCnt: number,
    private totalMeasureCnt: number,
    private callback?: Function | undefined,
  ) {}

  public plusAnomalyCnt() {
    this.anomaly++;
    this.total++;
    console.log(this.toString());
    if (this.isDone()) {
      this.afterDetectDone();
    }
  }

  public plusMeasureCnt() {
    this.measure++;
    this.total++;
    console.log(this.toString());
    if (this.isDone()) {
      this.afterDetectDone();
    }
  }

  private isDone() {
    return this.total === this.totalDetectCnt;
  }

  private afterDetectDone() {
    Utils.figText('DETECT DONE');
    console.log(`检测耗时: ${(Date.now() - this.startTime) / 1000}s`);
    this.callback?.();
  }

  public toString(): string {
    return `${chalk.cyan.bold('******************************')}
  ${chalk.cyan.bold('点位总数')}: ${chalk.green.bold(this.totalPointCnt)}
  ${chalk.cyan.bold('图片总数')}: ${chalk.green.bold(this.totalImgCnt)}
  ${chalk.cyan.bold('检测总数')}: ${chalk.magenta.bold(this.total)}/${chalk.green.bold(this.totalDetectCnt)}
  ${chalk.cyan.bold('外观总数')}: ${chalk.magenta.bold(this.anomaly)}/${chalk.green.bold(this.totalAnomalyCnt)}
  ${chalk.cyan.bold('测量总数')}: ${chalk.magenta.bold(this.measure)}/${chalk.green.bold(this.totalMeasureCnt)}
  ${chalk.cyan.bold('******************************')}`;
  }
}
