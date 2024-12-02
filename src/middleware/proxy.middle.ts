import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import { createProxyMiddleware } from 'http-proxy-middleware';
import AppConfig from '../app.config';

@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const { host, port } = AppConfig.anomalyRemoteCfg;
    const target = `${host}:${port}`;
    createProxyMiddleware({
      target, // 目标服务地址
      changeOrigin: true,
    })(req, res, next);
  }
}
