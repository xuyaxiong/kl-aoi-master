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
}
