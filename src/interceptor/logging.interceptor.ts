import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
const chalk = require('chalk');

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url } = request;
    const handler = context.getHandler().name;
    const controller = context.getClass().name;
    const params = request.params;
    const query = request.query;
    const body = request.body;

    const now = Date.now();

    // 使用 chalk 来美化输出
    console.log(chalk.cyan.bold('\n--- Request Details ---'));
    console.log(chalk.green.bold(`Method: `), chalk.white(method));
    console.log(chalk.green.bold(`URL: `), chalk.white(url));
    console.log(chalk.green.bold(`Controller: `), chalk.white(controller));
    console.log(chalk.green.bold(`Handler: `), chalk.white(handler));

    // 打印请求参数
    console.log(
      chalk.green.bold('Params: '),
      chalk.yellow(JSON.stringify(params, null, 2)),
    );
    console.log(
      chalk.green.bold('Query: '),
      chalk.yellow(JSON.stringify(query, null, 2)),
    );
    console.log(
      chalk.green.bold('Body: '),
      chalk.yellow(JSON.stringify(body, null, 2)),
    );

    return next.handle().pipe(
      tap(() => {
        const elapsedTime = Date.now() - now;
        console.log(chalk.cyan.bold(`--- Response Completed ---`));
        console.log(
          chalk.magenta.bold(`Time Taken: `),
          chalk.white(`${elapsedTime}ms\n`),
        );
      }),
    );
  }
}
