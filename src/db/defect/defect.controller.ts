import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { DefectService } from './defect.service';
import { Defect } from './defect.entity';
import HttpResponse from 'src/utils/api_res';

@Controller('defect')
export class DefectController {
  constructor(private readonly defectService: DefectService) {}

  @Get()
  async findAll(): Promise<HttpResponse<Defect[]>> {
    return HttpResponse.ok(await this.defectService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<HttpResponse<Defect>> {
    return HttpResponse.ok(await this.defectService.findOne(id));
  }

  @Post()
  async create(
    @Body() createDefect: Partial<Defect>,
  ): Promise<HttpResponse<Defect>> {
    return HttpResponse.ok(await this.defectService.create(createDefect));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateDefect: Partial<Defect>,
  ): Promise<HttpResponse<Defect>> {
    return HttpResponse.ok(await this.defectService.update(id, updateDefect));
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.defectService.delete(id));
  }
}
