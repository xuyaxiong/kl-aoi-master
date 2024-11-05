import {
  Controller,
  Get,
  Param,
  Post,
  Body,
  Put,
  Delete,
} from '@nestjs/common';
import { PatternService } from './pattern.service';
import { Pattern } from './pattern.entity';
import HttpResponse from 'src/utils/api_res';

@Controller('pattern')
export class PatternController {
  constructor(private readonly patternService: PatternService) {}

  @Get()
  async findAll(): Promise<HttpResponse<Pattern[]>> {
    return HttpResponse.ok(await this.patternService.findAll());
  }

  @Get(':id')
  async findOne(@Param('id') id: number): Promise<HttpResponse<Pattern>> {
    return HttpResponse.ok(await this.patternService.findOne(id));
  }

  @Post()
  async create(
    @Body() createPattern: Partial<Pattern>,
  ): Promise<HttpResponse<Pattern>> {
    return HttpResponse.ok(await this.patternService.create(createPattern));
  }

  @Put(':id')
  async update(
    @Param('id') id: number,
    @Body() updatePattern: Partial<Pattern>,
  ): Promise<HttpResponse<Pattern>> {
    return HttpResponse.ok(await this.patternService.update(id, updatePattern));
  }

  @Delete(':id')
  async delete(@Param('id') id: number): Promise<HttpResponse<void>> {
    return HttpResponse.ok(await this.patternService.delete(id));
  }
}
