import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DetectService } from './detect.service';
import { ApiOperation } from '@nestjs/swagger';
import HttpResponse from 'src/utils/api_res';

@Controller('detect')
export class DetectController {
  constructor(private readonly detectService: DetectService) {}

  @Post('start')
  @ApiOperation({ summary: '开始检测' })
  public start() {
    try {
      this.detectService.start();
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }
}
