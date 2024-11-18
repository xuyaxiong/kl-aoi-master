import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DetectService } from './detect.service';
import { ApiOperation } from '@nestjs/swagger';
import HttpResponse from 'src/utils/api_res';
import { MeasureParam, StartParam } from './detect.param';

@Controller('detect')
export class DetectController {
  constructor(private readonly detectService: DetectService) {}

  @Post('start')
  @ApiOperation({ summary: '开始检测' })
  public start(@Body() startParam: StartParam) {
    try {
      this.detectService.start(startParam);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Post('measure')
  async measure(@Body() measureParam: MeasureParam) {
    try {
      const res = await this.detectService.measureRemote(
        measureParam.fno,
        measureParam,
      );
      return HttpResponse.ok(res);
    } catch (error) {
      return HttpResponse.err(error.msg);
    }
  }
}
