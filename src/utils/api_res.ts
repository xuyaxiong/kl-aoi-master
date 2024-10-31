export default class HttpResponse<T> {
  code: number;
  msg?: string;
  data?: T;

  constructor(code?: number, msg?: string, data?: T) {
    this.code = code || 200;
    this.msg = msg || '请求成功';
    this.data = data || null;
  }

  static ok<T>(data: T = null): HttpResponse<T> {
    return new HttpResponse(200, '请求成功', data);
  }

  static err<T>(msg: string = '请求失败'): HttpResponse<T> {
    return new HttpResponse(-1, msg, null);
  }
}
