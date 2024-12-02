import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
  Query,
} from '@nestjs/common';
import { FlawService } from './flaw.service';
import { Flaw } from './flaw.entity';
import HttpResponse from 'src/utils/api_res';

@Controller('flaw')
export class FlawController {
  constructor(private readonly flawService: FlawService) {}

  @Get()
  async findAll(
    @Query('materialId') materialId: string,
    @Query('patternId') patternId: number,
    @Query('imgIndex') imgIndex: number,
  ): Promise<HttpResponse<Flaw[]>> {
    return HttpResponse.ok(
      await this.flawService.findAll(materialId, patternId, imgIndex),
    );
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<HttpResponse<Flaw>> {
    return HttpResponse.ok(await this.flawService.findOne(id));
  }

  @Post()
  async create(@Body() createFlaw: Partial<Flaw>): Promise<HttpResponse<Flaw>> {
    return HttpResponse.ok(await this.flawService.create(createFlaw));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updateFlaw: Partial<Flaw>,
  ): Promise<HttpResponse<Flaw>> {
    return HttpResponse.ok(await this.flawService.update(id, updateFlaw));
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.flawService.delete(id));
  }
}
