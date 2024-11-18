import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
const path = require('path');
import '../extension';
import { ImagePtr } from 'src/camera/camera.bo';
import { PlcService } from 'src/plc/plc.service';
import { ReportData } from 'kl-ins';
import { CameraService } from './../camera/camera.service';
import {
  mockReportPos,
  mockImgSeqGenerator,
  mockAnomaly,
  mockMeasure,
  mockMeasureParam,
  mockAnomalyParam,
} from './detect.mock';
import {
  AnomalyDataItem,
  AnomalyDefectCapInfo,
  AnomalyRemoteCfg,
  AnomalyRes,
  DetectCfg,
  DetectedCounter,
  DetectInfoQueue,
  DetectType,
  LightType,
  MaterialBO,
  MeasureDataItem,
  MeasureRemoteCfg,
  RecipeBO,
} from './detect.bo';
import { AnomalyParam, MeasureParam, StartParam } from './detect.param';
import { RecipeService } from 'src/db/recipe/recipe.service';
import { CapPos } from 'src/plc/plc.bo';
import {
  capAnomalyDefectImgs,
  deDupAnomalyDataList,
  deDupMeasureDataList,
  exportAnomalyDataList,
  exportMeasureDataList,
  objToFile,
  parseReportPos,
} from './detect.utils';

enum DetectStatus {
  IDLE,
  CORRECTION_ONE,
  CORRECTION_TWO,
  DETECTING,
}

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);
  private detectInfoQueue: DetectInfoQueue;
  private detectCfgSeq: DetectCfg[];
  private detectedCounter: DetectedCounter;
  private totalImgCnt: number;
  private totalDetectCnt: number;
  private totalAnomalyCnt: number;
  private totalMeasureCnt: number;
  private currImgCnt: number;
  private materialBO: MaterialBO;
  private measureRemoteCfg: MeasureRemoteCfg;
  private anomalyRemoteCfg: AnomalyRemoteCfg;
  private detectStatus: DetectStatus = DetectStatus.DETECTING;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly cameraService: CameraService,
    private readonly recipeService: RecipeService,
  ) {
    this.measureRemoteCfg =
      this.configService.get<MeasureRemoteCfg>('measureRemoteCfg');
    this.anomalyRemoteCfg =
      this.configService.get<AnomalyRemoteCfg>('anomalyRemoteCfg');
    this.detectCfgSeq = this.configService.get<DetectCfg[]>('detectCfgSeq');
    console.log('detectCfgSeq =', this.detectCfgSeq);
    this.setReportDataHandler();
  }

  public async start(startParam: StartParam) {
    const { sn, recipeId } = startParam;
    this.cameraService.setGrabMode('external'); // 相机设置为外触发模式
    this.materialBO = await this.initMaterialBO(sn, recipeId);
    console.log(this.materialBO);
    this.detectInfoQueue = new DetectInfoQueue(
      this.detectCfgSeq,
      this.materialBO.outputPath,
    );
    this.anomalyRawList = [];
    this.measureRawList = [];
    this.anomalyDefectCapInfoList = [];
    const totalPointCnt = this.materialBO.recipeBO.totalDotNum;
    const detectCount = this.calcDetectCount(this.detectCfgSeq, totalPointCnt);
    this.totalImgCnt = detectCount.totalImgCnt;
    this.totalDetectCnt = detectCount.totalDetectCnt;
    this.totalAnomalyCnt = detectCount.totalAnomalyCnt;
    this.totalMeasureCnt = detectCount.totalMeasureCnt;
    this.currImgCnt = 0;
    this.logger.warn(`******************************`);
    this.logger.warn(`总点位数: ${totalPointCnt}`);
    this.logger.warn(`总图片数: ${this.totalImgCnt}`);
    this.logger.warn(`总检测数: ${this.totalDetectCnt}`);
    this.logger.warn(`总外观数: ${this.totalAnomalyCnt}`);
    this.logger.warn(`总测量数: ${this.totalMeasureCnt}`);
    this.logger.warn(`******************************`);
    this.detectedCounter = new DetectedCounter(
      totalPointCnt,
      this.totalImgCnt,
      this.totalDetectCnt,
      this.totalAnomalyCnt,
      this.totalMeasureCnt,
      async () => {
        // 原始测量结果去重
        const dedupMeasureDataList = deDupMeasureDataList(this.measureRawList);
        console.log('去重前测量结果:', this.measureRawList.length);
        console.log('去重后测量结果:', dedupMeasureDataList.length);
        console.log(
          '测量去重数量:',
          this.measureRawList.length - dedupMeasureDataList.length,
        );
        exportMeasureDataList(
          'measure.csv',
          this.materialBO.dataOutputPath,
          dedupMeasureDataList,
        );
        // 原始外观结果去重
        const dedupAnomalyDataList = deDupAnomalyDataList(this.anomalyRawList);
        console.log('去重前外观结果:', this.anomalyRawList.length);
        console.log('去重后外观结果:', dedupAnomalyDataList.length);
        console.log(
          '外观去重数量:',
          this.anomalyRawList.length - dedupAnomalyDataList.length,
        );
        exportAnomalyDataList(
          'anomaly.csv',
          this.materialBO.dataOutputPath,
          dedupAnomalyDataList,
        );

        // 截取外观缺陷小图
        await capAnomalyDefectImgs(
          this.detectInfoQueue.imagePtrMap,
          this.anomalyDefectCapInfoList,
          this.materialBO.anomalyDefectCapImgPath,
        );
      },
    );
    // this.eventEmitter.emit(`startCorrection`);
    mockImgSeqGenerator(this.eventEmitter, this.totalImgCnt, 300);
  }

  @OnEvent('startCorrection')
  private async correctionTrigger() {
    // 1. 切换到纠偏1状态
    this.detectStatus = DetectStatus.CORRECTION_ONE;
    // 1.1. 运动至纠偏点位1
    await this.moveToXY(this.materialBO.recipeBO.correctionPos1);
    // 1.2. 触发拍照
    await this.plcService.takePhoto();
  }

  private anomalyRawList: AnomalyDataItem[];
  private measureRawList: MeasureDataItem[];
  // 外观缺陷小图信息
  private anomalyDefectCapInfoList: AnomalyDefectCapInfo[];
  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr) {
    if (this.detectStatus === DetectStatus.CORRECTION_ONE) {
      // 1.3. 获取纠偏点位1图片
      const img1Ptr = imagePtr;
      // 1.4. 获取纠偏点位1坐标
      const pos1 = await this.getCurrPos();
      // 1.5. 运动至纠偏点位2
      await this.moveToXY(this.materialBO.recipeBO.correctionPos2);
      // 2. 切换到纠偏2状态
      this.detectStatus = DetectStatus.CORRECTION_TWO;
      // 2.1. 触发拍照
      this.plcService.takePhoto();
    } else if (this.detectStatus === DetectStatus.CORRECTION_TWO) {
      // 2.2. 获取纠偏点位2图片
      const img2Ptr = imagePtr;
      // 2.3. 获取纠偏点位2坐标
      const pos2 = await this.getCurrPos();
      // TODO 2.4. 调用纠偏接口
      const correctionXY = { x: 0, y: 0 };
      // 2.5. 执行纠偏运动
      await this.moveToXY(correctionXY);
      // 3. 切换到检测状态
      this.detectStatus = DetectStatus.DETECTING;
      // 3.1. 下发拍照点位
      await this.plcService.capPos({
        capPosList: this.materialBO.recipeBO.dotList,
        sliceSize: 100,
      });
    } else if (this.detectStatus === DetectStatus.DETECTING) {
      this.currImgCnt += 1;
      this.logger.log(`当前收到图片数量: ${this.currImgCnt}`);
      this.detectInfoQueue.addImagePtr(imagePtr);
      this.detectInfoQueue.addPos(mockReportPos()); // TODO 随机坐标
      // const imagePath = saveTmpImagePtr(imagePtr);
      // console.log(imagePath);
      while (!this.detectInfoQueue.isEmpty()) {
        const detectInfoList = this.detectInfoQueue.shift();
        // console.log('detectInfoList =', detectInfoList);
        for (const detectInfo of detectInfoList) {
          const { pointIdx, pos, imagePtr, lightType, detectType } = detectInfo;
          const fno = imagePtr.frameId;
          this.logger.log(
            `\n点位: ${pointIdx}
出图帧号：${fno}
光源类型: ${lightType === LightType.COAXIAL ? '同轴' : '环光'}
检测类型: ${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
          );
          if (detectType === DetectType.ANOMALY) {
            // 送外观检测
            const { anomalyList, flawList } = await this.anomalyRemote(
              fno,
              null,
            ); // TODO flawList 需插入数据库
            const anomalyDefectCapInfoArr = flawList.map((item) => {
              return {
                fno: item.fno,
                R: item.coor.R,
                C: item.coor.C,
                chipId: item.coor.chipId,
                type: item.type,
                left: item.position[0],
                top: item.position[1],
                width: item.position[2],
                height: item.position[3],
              };
            });
            this.anomalyDefectCapInfoList.push(...anomalyDefectCapInfoArr);
            this.anomalyRawList.push(...anomalyList);
            this.detectedCounter.plusAnomalyCnt();
          } else if (detectType === DetectType.MEASURE) {
            // 送测量
            const measureRes = await this.measureRemote(fno, null);
            this.measureRawList.push(...measureRes);
            this.detectedCounter.plusMeasureCnt();
          }
          // console.log('anomalyRawList =', this.anomalyRawList);
          // console.log('measureResList =', this.measureResList);
        }
      }
    }
  }

  // 处理上报数据
  private setReportDataHandler() {
    this.plcService.setReportDataHandler(async (reportData: ReportData) => {
      const { modNum, insNum, data } = reportData;
      console.log(reportData);
      // 处理数据上报
      if (modNum === 4 && insNum === 4) {
        // 拍摄点位坐标
        const reportPos = parseReportPos(data);
        console.log(reportPos);
        this.detectInfoQueue.addPos(reportPos);
      }
    });
  }

  private async initMaterialBO(sn: string, recipeId: number) {
    const recipe = await this.recipeService.findById(recipeId);
    const recipeBO = new RecipeBO(recipeId, recipe.name, recipe.config);
    return new MaterialBO(sn, recipeBO);
  }

  // 运动到该位置
  private async moveToXY(coor: CapPos) {
    const moveParam = {
      axisInfoList: [
        {
          axisNum: 1,
          speed: 100,
          dest: coor.x,
          isRelative: false,
        },
        {
          axisNum: 2,
          speed: 100,
          dest: coor.y,
          isRelative: false,
        },
      ],
    };
    await this.plcService.move(moveParam);
  }

  // 获取当前坐标
  private async getCurrPos(): Promise<CapPos> {
    const res = await this.plcService.getPos({ axisList: [1, 2] });
    return { x: res[0].pos, y: res[1].pos };
  }

  private calcDetectCount(detectCfgSeq: DetectCfg[], totalPointCnt: number) {
    const detectCntPerPoint = detectCfgSeq
      .map((detectCfg) => detectCfg.detectTypeList.length)
      .reduce((acc, curr) => acc + curr, 0);
    const anomalyCntPerPoint = detectCfgSeq
      .map(
        (detectCfg) =>
          detectCfg.detectTypeList.filter(
            (detectType) => detectType === DetectType.ANOMALY,
          ).length,
      )
      .reduce((acc, curr) => acc + curr, 0);
    const measureCntPerPoint = detectCfgSeq
      .map(
        (detectCfg) =>
          detectCfg.detectTypeList.filter(
            (detectType) => detectType === DetectType.MEASURE,
          ).length,
      )
      .reduce((acc, curr) => acc + curr, 0);
    const imgCntPerPoint = detectCfgSeq.length;
    return {
      totalImgCnt: imgCntPerPoint * totalPointCnt,
      totalDetectCnt: detectCntPerPoint * totalPointCnt,
      totalAnomalyCnt: anomalyCntPerPoint * totalPointCnt,
      totalMeasureCnt: measureCntPerPoint * totalPointCnt,
    };
  }

  public async measureRemote(fno: number, measureParam: MeasureParam) {
    const measureUrl = `${this.measureRemoteCfg.host}:${this.measureRemoteCfg.port}/measure/measure`;
    try {
      const param = mockMeasureParam(fno);
      objToFile(
        param,
        path.join(this.materialBO.detectParamPath, 'measureParams'),
        `${param.fno}.json`,
      );
      const res = await axios.post(measureUrl, param); // TODO mock请求参数
      const data = res.data.data;
      return data;
    } catch (error) {
      this.logger.error(`${error.message}`);
      return [];
    }
  }

  public async anomalyRemote(
    fno: number,
    anomalyParam: AnomalyParam,
  ): Promise<AnomalyRes> {
    const anomalyUrl = `${this.anomalyRemoteCfg.host}:${this.anomalyRemoteCfg.port}/anomaly/anomaly`;
    try {
      const param = mockAnomalyParam(fno);
      objToFile(
        param,
        path.join(this.materialBO.detectParamPath, 'anomalyParams'),
        `${param.fno}.json`,
      );
      const res = await axios.post(anomalyUrl, param); // TODO mock请求参数
      const data = res.data.data;
      return data;
    } catch (error) {
      this.logger.error(`${error.message}`);
      return {
        flawList: [],
        anomalyList: [],
      } as AnomalyRes;
    }
  }
}
