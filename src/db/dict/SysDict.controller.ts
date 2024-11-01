import { Controller } from '@nestjs/common';
import { SysDictService } from './SysDict.service';
import { ApiTags } from '@nestjs/swagger';
import { Get, Post, Body, Query } from '@nestjs/common';
import {
  AddDictTypeParam,
  AddDictItemParam,
  GetDictItemParam,
  GetDictTypeParam,
  GetDictItemListParam,
} from './SysDict.param';
import HttpResponse from 'src/utils/api_res';

@ApiTags('sysDict')
@Controller('sysDict')
export class SysDictController {
  constructor(public readonly sysDictService: SysDictService) {}

  @Post('addDictType')
  async addDictType(@Body() addDictTypeParam: AddDictTypeParam) {
    await this.sysDictService.addDictType(addDictTypeParam);
    return HttpResponse.ok();
  }

  @Post('addDictItem')
  async addDictItem(@Body() addDictItemParam: AddDictItemParam) {
    await this.sysDictService.addDictItem(addDictItemParam);
    return HttpResponse.ok();
  }

  @Post('getDictTypeByCode')
  async getDictTypeByCode(@Body() getDictTypeParam: GetDictTypeParam) {
    return HttpResponse.ok(
      await this.sysDictService.getDictTypeByCode(getDictTypeParam),
    );
  }

  @Post('getDictItemByCode')
  async getDictItemByCode(@Body() getDictItemParam: GetDictItemParam) {
    return HttpResponse.ok(
      await this.sysDictService.getDictItemByCode(getDictItemParam),
    );
  }

  @Post('getDictItemListByTypeCode')
  async getDictItemListByTypeCode(
    @Body() getDictItemListParam: GetDictItemListParam,
  ) {
    return HttpResponse.ok(
      await this.sysDictService.getDictItemListByTypeCode(getDictItemListParam),
    );
  }
}
