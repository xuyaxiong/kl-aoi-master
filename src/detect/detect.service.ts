import { Logger, Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ConfigService } from '@nestjs/config';
import '../extension';

@Injectable()
export class DetectService {
  private readonly logger = new Logger(DetectService.name);

  constructor(
    private readonly eventEmitter: EventEmitter2,
    private readonly configService: ConfigService,
  ) {}
}
