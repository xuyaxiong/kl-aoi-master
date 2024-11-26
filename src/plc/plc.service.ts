import { Injectable } from '@nestjs/common';
const _ = require('lodash');
import {
  ClientProxy,
  EnumAxisIns,
  HomeIns,
  GetPosIns,
  MoveIns,
  JogStartIns,
  JogStopIns,
  ReportDataHandler,
} from 'kl-ins';
import {
  HomeParam,
  GetPosParam,
  MoveParam,
  JogStartParam,
  JogStopParam,
  CapPosParam,
} from './plc.param';
import { ConfigService } from '@nestjs/config';
import { CapPos, PlcTcpConfig } from './plc.bo';
import {
  CapPosIns,
  InitPlcIns,
  StartPlcIns,
  SwitchModeIns,
  TakePhotoIns,
} from './plc.ins';

@Injectable()
export class PlcService {
  private client: ClientProxy;
  private plcTcpConfig: PlcTcpConfig;

  constructor(private readonly configService: ConfigService) {
    this.plcTcpConfig = this.configService.get<PlcTcpConfig>('plcTcpConfig');
    this.client = new ClientProxy(
      this.plcTcpConfig.name,
      this.plcTcpConfig.host,
      this.plcTcpConfig.port,
    );
    this.client.connect();
  }

  public setReportDataHandler(handler: ReportDataHandler) {
    this.client.setReportDataHandler(handler);
  }

  async enumAxis() {
    const enumAxisIns = new EnumAxisIns();
    return await this.client.sendIns(enumAxisIns);
  }

  async home(homeParam: HomeParam) {
    const homeIns = new HomeIns(homeParam.axisList);
    return await this.client.sendIns(homeIns);
  }

  async getPos(getPosParam: GetPosParam) {
    const getPosIns = new GetPosIns(getPosParam.axisList);
    return (await this.client.sendIns(getPosIns)) as any; // TODO 后续定义返回类型
  }

  async move(moveParam: MoveParam) {
    const moveIns = new MoveIns(moveParam.axisInfoList);
    return await this.client.sendIns(moveIns);
  }

  async jogStart(jogStartParam: JogStartParam) {
    const jogStartIns = new JogStartIns(
      jogStartParam.axisNum,
      jogStartParam.speed,
      jogStartParam.direction,
    );
    await this.client.sendIns(jogStartIns);
  }

  async jogStop(jogStopParam: JogStopParam) {
    const jogStopIns = new JogStopIns(jogStopParam.axisNum);
    await this.client.sendIns(jogStopIns);
  }

  public async takePhoto() {
    const takePhotoIns = new TakePhotoIns();
    await this.client.sendIns(takePhotoIns);
  }

  public async initPlc() {
    const ins = new InitPlcIns();
    await this.client.sendIns(ins);
  }

  public async startPlc() {
    const ins = new StartPlcIns();
    await this.client.sendIns(ins);
  }

  public async switchMode(mode: number) {
    const ins = new SwitchModeIns(mode);
    await this.client.sendIns(ins);
  }

  private async _capPos(total: number, startIdx: number, capPosList: CapPos[]) {
    const capPosIns = new CapPosIns(total, startIdx, capPosList);
    await this.client.sendIns(capPosIns);
  }

  async capPos(capPosParam: CapPosParam) {
    const capPosSliceArr = _.chunk(
      capPosParam.capPosList,
      capPosParam.sliceSize,
    );
    let start = 0;
    for (let i = 0; i < capPosSliceArr.length; ++i) {
      await this._capPos(
        capPosParam.capPosList.length,
        start,
        capPosSliceArr[i],
      );
      start += capPosSliceArr[i].length;
    }
  }
}
