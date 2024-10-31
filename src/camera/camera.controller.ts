import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { CameraService } from './camera.service';
import HttpResponse from 'src/utils/api_res';
import { ApiOperation } from '@nestjs/swagger';
import { SetExposureTimeParam } from './camera.param';

@Controller('camera')
export class CameraController {
  constructor(private readonly cameraService: CameraService) {}

  @Get('list')
  getList() {
    return this.cameraService.getCameraList();
  }

  @Post('setExposureTime/:id')
  @ApiOperation({ summary: '设置曝光时间' })
  public setExposureTime(
    @Param('id') id: number,
    @Body() setExposureTimeParam: SetExposureTimeParam,
  ) {
    try {
      this.cameraService.setExposureTime(id, setExposureTimeParam.expTime);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Get('getExposureTime/:id')
  @ApiOperation({ summary: '获取曝光时间' })
  public getExposureTime(@Param('id') id: number) {
    try {
      const time = this.cameraService.getExposureTime(id);
      return HttpResponse.ok(time);
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Get('subscribe/:name')
  @ApiOperation({ summary: '后端接受数据源订阅' })
  subscribe(@Param('name') name: string) {
    try {
      this.cameraService.subscribe(name);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Get('grabInternal/:id')
  @ApiOperation({ summary: '内触发连续采集' })
  grabInternal(@Param('id') id: number) {
    try {
      this.cameraService.grabInternal(id);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Get('grabExternal/:id')
  @ApiOperation({ summary: '外触发连续采集' })
  grabExternal(@Param('id') id: number) {
    try {
      this.cameraService.grabExternalWithoutCb(id);
      return HttpResponse.ok();
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }

  @Get('grabStop/:id')
  @ApiOperation({ summary: '相机停止采集' })
  grabStop(@Param('id') id: number) {
    try {
      return this.cameraService.grabStop(id);
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }
}
