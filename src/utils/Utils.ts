import * as fs from 'fs';
const chalk = require('chalk');
const figlet = require('figlet');
export default class Utils {
  public static foo() {
    return 'bar';
  }

  public static ensurePathSync(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }

  public static figText(text: string, width: number = 100) {
    console.log(
      chalk.green(
        figlet.textSync(text, {
          horizontalLayout: 'default',
          verticalLayout: 'default',
          width,
        }),
      ),
    );
  }

  public static genRandomStr(length = 10) {
    const charset =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; // 字符集
    let randomStr = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length);
      randomStr += charset[randomIndex];
    }
    return randomStr;
  }

  public static sleep(ms: number) {
    return new Promise((resolve, reject) => {
      setTimeout(resolve, ms);
    });
  }
}
