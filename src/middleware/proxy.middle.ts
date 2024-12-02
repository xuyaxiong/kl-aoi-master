import { Injectable, NestMiddleware, HttpStatus } from '@nestjs/common';
import AppConfig from '../app.config';
import axios from 'axios';

const { host, port } = AppConfig.anomalyRemoteCfg;
const target = `${host}:${port}`;
@Injectable()
export class ProxyMiddleware implements NestMiddleware {
  use(req: any, res: any, next: () => void) {
    const options = {
      method: req.method,
      url: `${target}${req.originalUrl}`,
      data: req.body,
    };
    axios(options)
      .then((response) => {
        res
          .status(response.status)
          .send(
            typeof response.data == 'number'
              ? `${response.data}`
              : response.data,
          );
      })
      .catch((error) => {
        console.error('Error during proxy request:', error.code);
        res
          .status(HttpStatus.INTERNAL_SERVER_ERROR)
          .send('Internal Server Error');
      });
  }
}
