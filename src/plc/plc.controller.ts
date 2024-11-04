import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { PlcService } from './plc.service';
import HttpResponse from 'src/utils/api_res';
import {
  MoveParam,
  JogStartParam,
  JogStopParam,
  HomeParam,
  GetPosParam,
} from './plc.param';

@Controller('electric')
export class PlcController {
  constructor(private plcService: PlcService) {}

  @Post('home')
  @ApiOperation({
    summary: '复位指令',
  })
  async home(@Body() homeParam: HomeParam) {
    try {
      const retValArr = await this.plcService.home(homeParam);
      return HttpResponse.ok(retValArr);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('enumAxis')
  @ApiOperation({
    summary: '枚举有效轴号列表指令',
  })
  async enumAxis() {
    try {
      const retValArr = await this.plcService.enumAxis();
      return HttpResponse.ok(retValArr);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('getPos')
  @ApiOperation({
    summary: '获取当前速度与当前位置指令',
  })
  async getPos(@Body() getPosParam: GetPosParam) {
    try {
      const res = await this.plcService.getPos(getPosParam);
      return HttpResponse.ok(res);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('moveV3')
  @ApiOperation({
    summary: '运动指令',
  })
  async move(@Body() moveParam: MoveParam) {
    try {
      const retValArr = await this.plcService.move(moveParam);
      return HttpResponse.ok(retValArr);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('jogStart')
  @ApiOperation({
    summary: '手动示教移动开始指令',
  })
  async jogStart(@Body() jogStartParam: JogStartParam) {
    try {
      await this.plcService.jogStart(jogStartParam);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('jogStop')
  @ApiOperation({
    summary: '手动示教移动停止指令',
  })
  async jogStop(@Body() jogStopParam: JogStopParam) {
    try {
      await this.plcService.jogStop(jogStopParam);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err();
    }
  }
}
