import { Controller, Post, Body, Get, Query, Param } from '@nestjs/common';
import { DetectService } from './detect.service';

@Controller('detect')
export class DetectController {
  constructor(private readonly detectService: DetectService) {}
}
