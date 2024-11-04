import { Injectable } from '@nestjs/common';
import {
  ClientProxy,
  EnumAxisIns,
  HomeIns,
  GetPosIns,
  MoveIns,
  JogStartIns,
  JogStopIns,
} from 'kl-ins';
import {
  HomeParam,
  GetPosParam,
  MoveParam,
  JogStartParam,
  JogStopParam,
} from './plc.param';
import { ConfigService } from '@nestjs/config';
import { PlcTcpConfig } from './plc.bo';

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
    return await this.client.sendIns(getPosIns);
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
}