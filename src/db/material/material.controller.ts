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
import HttpResponse from 'src/utils/api_res';

@Controller('material')
export class MaterialController {
  constructor(private readonly materialService: MaterialService) {}

  @Get()
  async findAll(): Promise<HttpResponse<Material[]>> {
    return HttpResponse.ok(await this.materialService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: string): Promise<HttpResponse<Material>> {
    return HttpResponse.ok(await this.materialService.findOne(id));
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
}
