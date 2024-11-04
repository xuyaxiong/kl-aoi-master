import * as fs from 'fs';
export default class Utils {
  public static foo() {
    return 'bar';
  }

  public static ensurePathSync(path: string) {
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path, { recursive: true });
    }
  }
}
