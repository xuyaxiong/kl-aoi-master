const ref = require('ref-napi') as typeof import('ref-napi');

Buffer.prototype.toDoubleArr = function () {
  return Array.from(new Float64Array(this.buffer));
};

Buffer.prototype.toFloatArr = function () {
  return Array.from(new Float32Array(this.buffer));
};

Buffer.prototype.toIntArr = function () {
  return Array.from(new Int32Array(this.buffer));
};

Buffer.prototype.toStr = function () {
  return ref.readCString(this, 0);
};

Array.prototype.doubleToBuffer = function () {
  return Buffer.from(Float64Array.from(this).buffer);
};

Array.prototype.floatToBuffer = function () {
  return Buffer.from(Float32Array.from(this).buffer);
};

Array.prototype.intToBuffer = function () {
  return Buffer.from(Int32Array.from(this).buffer);
};

String.prototype.toBuffer = function (length = 256) {
  const tmpBuf = Buffer.alloc(length);
  ref.writeCString(tmpBuf, 0, this);
  return tmpBuf;
};
