import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
const path = require('path');
const _ = require('lodash');
import '../extension';
import { ImagePtr } from '../camera/camera.bo';
import { PlcService } from '../plc/plc.service';
import { ReportData } from 'kl-ins';
import { CameraService } from './../camera/camera.service';
import {
  mockImgSeqGenerator,
  mockAnomaly,
  mockMeasure,
  mockMeasureParam,
  mockAnomalyParam,
} from './detect.mock';
import {
  AnomalyDataItem,
  AnomalyDefectCapInfo,
  AnomalyFlawItem,
  AnomalyRemoteCfg,
  AnomalyRes,
  DetectCfg,
  DetectedCounter,
  DetectInfoQueue,
  DetectNumCount,
  DetectType,
  LightType,
  MaterialBO,
  MeasureDataItem,
  MeasureRemoteCfg,
  RecipeBO,
  ReportPos,
  Corrector,
  DetectStage,
  StageState,
} from './bo';
import { AnomalyParam, MeasureParam, StartParam } from './detect.param';
import { RecipeService } from '../db/recipe/recipe.service';
import { FlawService } from '../db/flaw/flaw.service';
import { CapPos } from '../plc/plc.bo';
import {
  capAnomalyDefectImgs,
  capMeasureDefectImgs,
  deDupAnomalyDataList,
  deDupMeasureDataList,
  exportAnomalyDataList,
  exportMeasureDataList,
  exportMergedDataList,
  filtrateMeasureDefect,
  mergeAnomalyAndMeasureData,
  objToFile,
  parseReportPos,
  transOrigDotListToCapPosList,
} from './detect.utils';
import { MaterialService } from '../db/material/material.service';
import AppConfig from '../app.config';
import { SysDictService } from './../db/dict/SysDict.service';
import Utils from 'src/utils/Utils';
import { WsGateway } from '../ws/ws.gateway';

enum DetectStatus {
  IDLE,
  CORRECTION_ONE,
  CORRECTION_TWO,
  DETECTING,
}

const MOCK_OPEN = false;

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);
  private detectInfoQueue: DetectInfoQueue;
  private detectedCounter: DetectedCounter;
  private currImgCnt: number;
  private materialBO: MaterialBO;
  private corrector: Corrector;
  private measureRemoteCfg: MeasureRemoteCfg;
  private anomalyRemoteCfg: AnomalyRemoteCfg;
  private detectStatus: DetectStatus = DetectStatus.IDLE;

  private baseRecipePath: string;
  private width: number;
  private height: number;
  private channel: number;

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
    private readonly plcService: PlcService,
    private readonly cameraService: CameraService,
    private readonly materialService: MaterialService,
    private readonly recipeService: RecipeService,
    private readonly flawService: FlawService,
    private readonly sysDictService: SysDictService,
    private ws: WsGateway,
  ) {
    this.measureRemoteCfg = AppConfig.measureRemoteCfg;
    this.anomalyRemoteCfg = AppConfig.anomalyRemoteCfg;
    this.width = this.configService.get<number>('width');
    this.height = this.configService.get<number>('height');
    this.channel = this.configService.get<number>('channel');
    this.baseRecipePath = AppConfig.exportPath.recipePath;
    this.setReportDataHandler();
  }

  public async start(startParam: StartParam) {
    const { sn, recipeId } = startParam;
    this.cameraService.setGrabMode('external'); // 相机设置为外触发模式
    const lensParams = await this.getLensParams();
    this.materialBO = await this.initMaterialBO(sn, recipeId, lensParams);
    this.corrector = new Corrector(
      this.materialBO.outputPath,
      this.materialBO.recipeBO.recipePath,
    );
    this.detectInfoQueue = new DetectInfoQueue(
      this.materialBO.recipeBO.detectCfgSeq,
      this.materialBO.outputPath,
    );
    this.anomalyRawList = [];
    this.measureRawList = [];
    this.anomalyDefectCapInfoList = [];
    const totalPointCnt = this.materialBO.recipeBO.totalDotNum;
    const detectCount = this.calcDetectCount(
      this.materialBO.recipeBO.detectCfgSeq,
      totalPointCnt,
    );
    this.currImgCnt = 0;
    this.logger.warn(`******************************`);
    this.logger.warn(`总点位数: ${totalPointCnt}`);
    this.logger.warn(`总图片数: ${detectCount.totalImgCnt}`);
    this.logger.warn(`总检测数: ${detectCount.totalDetectCnt}`);
    this.logger.warn(`总外观数: ${detectCount.totalAnomalyCnt}`);
    this.logger.warn(`总测量数: ${detectCount.totalMeasureCnt}`);
    this.logger.warn(`******************************`);
    this.detectedCounter = new DetectedCounter(
      totalPointCnt,
      detectCount,
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

        // TODO 合并外观结果和测量结果
        const mergedDataList = mergeAnomalyAndMeasureData(
          this.materialBO.recipeBO.maxRow,
          this.materialBO.recipeBO.maxCol,
          this.materialBO.recipeBO.chipNum,
          dedupAnomalyDataList,
          dedupMeasureDataList,
        );
        exportMergedDataList(this.materialBO.dataOutputPath, mergedDataList);

        // 截取外观缺陷小图
        await capAnomalyDefectImgs(
          this.detectInfoQueue.imageInfoMap,
          this.anomalyDefectCapInfoList,
          this.materialBO.anomalyDefectCapImgPath,
        );

        // 获取测量缺陷小图信息
        const measureDefectDataItemList = filtrateMeasureDefect(
          dedupMeasureDataList, // ! 传入去重后的测量结果
          this.materialBO.recipeBO.chipMeasureX,
          this.materialBO.recipeBO.chipMeasureY,
          this.materialBO.recipeBO.chipMeasureR,
        );
        // 截取测量缺陷小图
        await capMeasureDefectImgs(
          this.detectInfoQueue.imageInfoMap,
          measureDefectDataItemList,
          this.materialBO.lensParams,
          this.materialBO.recipeBO.mappingParams,
          this.materialBO.getRectifyParams(),
          this.materialBO.recipeBO.chipSize,
          this.materialBO.measureDefectCapImgPath,
        );

        // ! 插入material
        this.materialService.create(this.materialBO.mapToMaterial());

        this.postMessageToWeb(DetectStage.OUTING, StageState.END, {
          matierialId: this.materialBO.id,
        });
      },
    );

    if (MOCK_OPEN) {
      mockImgSeqGenerator(
        this.eventEmitter,
        this.detectedCounter.detectCount.totalImgCnt,
        300,
      );
    } else {
      await this.plcService.initPlc();
      await this.plcService.startPlc();
    }
    this.postMessageToWeb(DetectStage.INCOMING, StageState.END, {
      materialId: this.materialBO.id,
    });
  }

  @OnEvent('startCorrection')
  private async correctionTrigger() {
    // 1. 切换到纠偏1状态
    this.detectStatus = DetectStatus.CORRECTION_ONE;
    // 1.1 调整曝光值
    this.cameraService.setExposureTime(
      0,
      this.materialBO.recipeBO.detectExposureTime,
    );
    // 1.2. 移动Z轴
    await this.moveToZ(this.materialBO.recipeBO.motorZ);
    // 1.3. 运动至纠偏点位1
    const locationL = this.materialBO.recipeBO.locationL;
    await this.moveToXY({
      x: locationL.motorCoor[0],
      y: locationL.motorCoor[1],
    });
    // 1.4. 触发拍照
    await this.plcService.takePhoto();
  }

  private anomalyRawList: AnomalyDataItem[];
  private measureRawList: MeasureDataItem[];
  // 外观缺陷小图信息
  private anomalyDefectCapInfoList: AnomalyDefectCapInfo[];
  @OnEvent('camera.grabbed')
  async grabbed(imagePtr: ImagePtr, reportPos?: ReportPos) {
    if (this.detectStatus === DetectStatus.CORRECTION_ONE) {
      // 1.5. 获取纠偏点位1图片
      const img1Ptr = imagePtr;
      // 1.6. 获取纠偏点位1坐标
      const pos1 = await this.getCurrPos();
      this.corrector.setPos1(pos1);
      this.corrector.setImg1(img1Ptr);
      // 1.7. 运动至纠偏点位2
      const locationR = this.materialBO.recipeBO.locationR;
      await this.moveToXY({
        x: locationR.motorCoor[0],
        y: locationR.motorCoor[1],
      });
      // 2. 切换到纠偏2状态
      this.detectStatus = DetectStatus.CORRECTION_TWO;
      // 2.1. 触发拍照
      this.plcService.takePhoto();
    } else if (this.detectStatus === DetectStatus.CORRECTION_TWO) {
      // 2.2. 获取纠偏点位2图片
      const img2Ptr = imagePtr;
      // 2.3. 获取纠偏点位2坐标
      const pos2 = await this.getCurrPos();
      this.corrector.setPos2(pos2);
      this.corrector.setImg2(img2Ptr);
      // TODO 2.4. 调用纠偏接口
      this.corrector.correct(
        this.materialBO.recipeBO.locationL,
        this.materialBO.recipeBO.locationR,
        this.materialBO.lensParams,
        this.materialBO.getRectifyParams(),
      );
      const correctionXY = { x: 0, y: 0 };
      // 2.5. 执行纠偏运动
      await this.moveToXY(correctionXY);
      // 3. 切换到检测状态
      this.detectStatus = DetectStatus.DETECTING;
      // 3.1. 下发拍照点位
      const capPosList = transOrigDotListToCapPosList(
        this.materialBO.recipeBO.dotList,
        this.materialBO.lensParams,
        this.materialBO.getRectifyParams(),
      );
      objToFile({ capPosList }, this.materialBO.outputPath, 'origDotList.json');
      await this.plcService.capPos({
        capPosList,
        sliceSize: 100,
      });
    } else if (this.detectStatus === DetectStatus.DETECTING) {
      this.currImgCnt += 1;
      this.logger.log(`当前收到图片数量: ${this.currImgCnt}`);
      this.detectInfoQueue.addImagePtr(imagePtr);
      if (reportPos) this.detectInfoQueue.addPos(reportPos);
      // const imagePath = saveTmpImagePtr(imagePtr);
      // console.log(imagePath);
      while (!this.detectInfoQueue.isEmpty()) {
        const detectInfoList = this.detectInfoQueue.shift();
        // console.log('detectInfoList =', detectInfoList);
        for (const detectInfo of detectInfoList) {
          const {
            pointIdx,
            pos,
            imagePtr,
            lightType,
            detectType,
            patternId,
            cntPerLightType,
            imgPath,
            maskPath,
            ignores,
            anomalyThreshold,
            modelFile,
          } = detectInfo;
          const fno = imagePtr.frameId;
          //           this.logger.log(
          //             `\n点位: ${pointIdx}
          // 出图帧号：${fno}
          // 光源类型: ${lightType === LightType.COAXIAL ? '同轴' : '环光'} 数量: ${cntPerLightType}
          // 检测类型: ${detectType === DetectType.ANOMALY ? '外观' : '测量'}`,
          //           );
          if (detectType === DetectType.ANOMALY) {
            // 送外观检测
            const anomalyParam: AnomalyParam = {
              fno,
              imagePath: imgPath,
              dbName: modelFile,
              flawCount: 300,
              anomalyThreshold,
              ignores,
              isFirst: false,
              pos: [pos.x, pos.y],
              lensParams: this.materialBO.lensParams,
              mappingParams: this.materialBO.recipeBO.mappingParams,
              rectifyParams: this.materialBO.getRectifyParams(),
              chipNum: this.materialBO.recipeBO.chipNum,
              chipSize: this.materialBO.recipeBO.chipSize,
              roiCornerPoint: this.materialBO.recipeBO.roiCornerPoint,
              imageSavePath: path.join(
                AppConfig.TMP_DIR,
                `${Utils.genRandomStr(5)}.jpg`,
              ),
              maskSavePath: maskPath,
              shildInfo: {
                path: this.materialBO.recipeBO.shildImgPath,
                col: this.materialBO.recipeBO.maxCol,
                row: this.materialBO.recipeBO.maxRow,
              },
            };
            const { anomalyList, flawList } = await this.anomalyRemote(
              fno,
              anomalyParam,
            );
            // TODO anomalyList 传递给前端
            // this.postMessageToWeb(DetectStage.DETECT_PROGRESS_ANOMALY_DONE, {
            //   materialId: this.materialBO.id,
            //   patternId,
            //   flaws: anomalyList,
            // });
            // flawList 插入数据库
            this.insertFlaws(patternId, cntPerLightType, flawList);
            // 保存外观缺陷小图信息
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
            // 保存外观检测结果
            this.anomalyRawList.push(...anomalyList);
            this.detectedCounter.plusAnomalyCnt();
          } else if (detectType === DetectType.MEASURE) {
            // 送测量
            const measureParam: MeasureParam = {
              fno,
              imagePath: imgPath.replace('D:\\kl-storage\\', 'X:\\'),
              imageSize: {
                width: this.materialBO.imgInfo.width,
                height: this.materialBO.imgInfo.height,
                channel: this.materialBO.imgInfo.channel,
              },
              pos: [pos.x, pos.y],
              lensParams: this.materialBO.lensParams,
              mappingParams: this.materialBO.recipeBO.mappingParams,
              rectifyParams: this.materialBO.getRectifyParams(),
              modelPath: this.materialBO.recipeBO.measureChipModelFile.replace(
                'D:\\kl-storage\\',
                'X:\\',
              ),
              padModelPath:
                this.materialBO.recipeBO.measurePadModelFile.replace(
                  'D:\\kl-storage\\',
                  'X:\\',
                ),
              chipNum: this.materialBO.recipeBO.chipNum,
              chipSize: this.materialBO.recipeBO.chipSize,
              roiCornerPoint: this.materialBO.recipeBO.roiCornerPoint,
              detectRegionSize: [
                this.materialBO.recipeBO.maxRow,
                this.materialBO.recipeBO.maxCol,
              ],
              measureThreshold: 0.7, // TODO
              postProcess: false,
            };
            const measureRes = await this.measureRemote(fno, measureParam);
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
      // console.log(reportData);
      // 处理数据上报
      if (modNum === 4 && insNum === 4) {
        // 拍摄点位坐标
        const reportPos = parseReportPos(data);
        console.log('点位上报:', reportPos);
        this.detectInfoQueue.addPos(reportPos);
      } else if (modNum === 4 && insNum === 5) {
        const status = data[7];
        if (status === 2) {
          console.log('receive start signal');
          this.eventEmitter.emit(`startCorrection`);
        }
      }
    });
  }

  private async initMaterialBO(
    sn: string,
    recipeId: number,
    lensParams: LensParams,
  ) {
    const recipe = await this.recipeService.findById(recipeId);
    const recipeBO = new RecipeBO(
      recipeId,
      recipe.name,
      this.baseRecipePath,
      recipe.config,
    );
    return new MaterialBO(sn, recipeBO, lensParams);
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

  // 移动Z轴
  private async moveToZ(z: number) {
    const moveParam = {
      axisInfoList: [
        {
          axisNum: 4,
          speed: 30,
          dest: z,
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

  private calcDetectCount(
    detectCfgSeq: DetectCfg[],
    totalPointCnt: number,
  ): DetectNumCount {
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
    const measureUrl = `${this.measureRemoteCfg.host}:${this.measureRemoteCfg.port}/api/measure/measure`;
    try {
      // const param = mockMeasureParam(fno);
      objToFile(
        measureParam,
        path.join(this.materialBO.detectParamPath, 'measureParams'),
        `${fno}.json`,
      );
      const res = await axios.post(measureUrl, measureParam);
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
    const anomalyUrl = `${this.anomalyRemoteCfg.host}:${this.anomalyRemoteCfg.port}/api/anomaly/anomaly`;
    try {
      // const param = mockAnomalyParam(fno);
      objToFile(
        anomalyParam,
        path.join(this.materialBO.detectParamPath, 'anomalyParams'),
        `${fno}.json`,
      );
      const res = await axios.post(anomalyUrl, anomalyParam);
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

  private postMessageToWeb(stage: string, state: string, data: object) {
    this.ws.publish('progress', {
      event: stage,
      state: state,
      info: data,
    });
  }

  private async insertFlaws(
    patternId: number,
    cntPerLightType: number,
    flawList: AnomalyFlawItem[],
  ) {
    const flawParts = _.chunk(flawList, 2000);
    for await (const part of flawParts) {
      const flawEntityList = part.map((flaw: AnomalyFlawItem) => {
        return {
          feature: flaw.feature,
          type: flaw.type,
          position: flaw.position.toString(),
          materialId: this.materialBO.id,
          patternId,
          imgIndex: cntPerLightType - 1,
        };
      });
      await this.flawService.saveInBatch(flawEntityList);
    }
  }

  private async getLensParams() {
    const dictItem = await this.sysDictService.getDictItemByCode({
      typeCode: 'SYS_CAM_CFG',
      code: 'lensParams',
    });
    if (dictItem) return JSON.parse(dictItem.value);
    else return [];
  }
}
