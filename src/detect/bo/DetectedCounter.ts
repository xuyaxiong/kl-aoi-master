const chalk = require('chalk');
import Utils from '../../utils/Utils';
import { DetectNumCount } from './types';

export class DetectedCounter {
  private total: number = 0;
  private anomaly: number = 0;
  private measure: number = 0;
  private startTime = Date.now();

  constructor(
    private totalPointCnt: number,
    public readonly detectCount: DetectNumCount,
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
    return this.total === this.detectCount.totalDetectCnt;
  }

  private afterDetectDone() {
    Utils.figInfo('DETECT DONE');
    console.log(`检测耗时: ${(Date.now() - this.startTime) / 1000}s`);
    this.callback?.();
  }

  public toString(): string {
    return `${chalk.cyan.bold('******************************')}
${chalk.cyan.bold('点位总数')}: ${chalk.green.bold(this.totalPointCnt)}
${chalk.cyan.bold('图片总数')}: ${chalk.green.bold(this.detectCount.totalImgCnt)}
${chalk.cyan.bold('检测总数')}: ${chalk.magenta.bold(this.total)}/${chalk.green.bold(this.detectCount.totalDetectCnt)}
${chalk.cyan.bold('外观总数')}: ${chalk.magenta.bold(this.anomaly)}/${chalk.green.bold(this.detectCount.totalAnomalyCnt)}
${chalk.cyan.bold('测量总数')}: ${chalk.magenta.bold(this.measure)}/${chalk.green.bold(this.detectCount.totalMeasureCnt)}
${chalk.cyan.bold('******************************')}`;
  }
}
