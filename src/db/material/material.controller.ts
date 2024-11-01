import { MaterialService } from './material.service';
import { ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Body, Query, Param } from '@nestjs/common';

@ApiTags('material')
@Controller('material')
export class MaterialController {
  constructor(private readonly service: MaterialService) {}
}
