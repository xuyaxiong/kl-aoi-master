import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { MaterialService } from './material.service';
import { Material } from './material.entity';
import HttpResponse from '../../utils/api_res';
import {
  GetMapCsvResultParam,
  QueryParam,
  SaveFullImgParam,
} from './material.param';
import { PageRes } from './material.types';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Post()
  async findAll(
    @Body() queryParam: QueryParam,
  ): Promise<HttpResponse<PageRes<Material>>> {
    return HttpResponse.ok(await this.materialService.page(queryParam));
  }

  @Get(':id')
  async findById(@Param('id') id: string): Promise<HttpResponse<Material>> {
    return HttpResponse.ok(await this.materialService.findById(id));
  }

  @Post()
  async create(
    @Body() createMaterial: Partial<Material>,
  ): Promise<HttpResponse<Material>> {
    return HttpResponse.ok(await this.materialService.create(createMaterial));
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateMaterial: Partial<Material>,
  ): Promise<HttpResponse<Material>> {
    return HttpResponse.ok(
      await this.materialService.update(id, updateMaterial),
    );
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.materialService.delete(id));
  }

  // 获取缺陷结果文件列表
  @Get('getMapCsvList/:id')
  async getMapCsvList(@Param('id') materialId: string) {
    try {
      const data = await this.materialService.getMapCsvList(materialId);
      return HttpResponse.ok(data);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  // 获取指定缺陷结果文件
  @Post('getMapCsvResult')
  async getMapCsvResult(@Body() getMapCsvResultParam: GetMapCsvResultParam) {
    try {
      const data = await this.materialService.getMapCsvResult(
        getMapCsvResultParam.csv,
      );
      return HttpResponse.ok(data);
    } catch (error) {
      return HttpResponse.err();
    }
  }

  @Post('saveFullImg')
  async saveFullImg(@Body() saveFullImgParam: SaveFullImgParam) {
    const { materialId, unit } = saveFullImgParam;
    try {
      const outputPath = await this.materialService.saveFullImg(
        materialId,
        saveFullImgParam.patternId,
        unit,
      );
      return HttpResponse.ok(outputPath);
    } catch (error) {
      return HttpResponse.err(error.message);
    }
  }
}
