const FFI = require('ffi-napi');
const DLL_PATH = 'D:\\kl-storage\\dll\\';
const ffiCb = new Map();

const anomaly = (anomalyName) => {
  const pathArray = process.env.PATH.split(';');
  pathArray.unshift(DLL_PATH);
  process.env.PATH = pathArray.join(';');
  const Library = new FFI.Library(DLL_PATH + `${anomalyName}.dll`, {
    initEngine: ['bool', ['string', 'int', 'int', 'int', 'int', 'int']],

    destroyEngine: ['bool', []],

    anomalyDetect_FULL2: [
      'int',
      [
        'string',
        'string',
        'uchar*',
        'int',
        'int',
        'int',
        'int',
        'float',
        'int *',
        'int',
        'int',
        'int',
        'int',
        'double*',
        'float *',
        'double *',
        'double*',
        'double*',
        'double*',
        'double*',
        'int',
        'double*',
        'string',
        'string',
      ],
    ],

    getChipCoors: [
      'void',
      [
        'int',
        'int',
        'int',
        'double *',
        'double*',
        'double*',
        'double*',
        'double*',
        'double *',
      ],
    ],

    featureExtract: ['bool', ['uchar *', 'int', 'int', 'int', 'float *']],

    erase: ['int', ['string', 'int', 'int *']],

    erase_type: ['int', ['string', 'int']],

    load_DB: ['int', ['string']],

    release_DB: ['bool', ['string']],

    coreLearn: [
      'int',
      [
        'string',
        'uchar *',
        'uchar *',
        'int',
        'int',
        'int',
        'int',
        'int',
        'float',
        'float *',
      ],
    ],

    insert: ['int', ['string', 'int', 'int *', 'int *', 'float *']],

    update_one: ['int', ['string', 'int', 'int', 'float *']],

    update: ['int', ['string', 'int', 'int *', 'int *', 'float *']],

    query: ['bool', ['string', 'int', 'float *', 'float *', 'int *', 'int *']],

    setCallback: ['bool', ['pointer']],

    get_dll_version: ['string', []],
  });

  Library.addDetectListener = (cb) => {
    const callback = FFI.Callback(
      'void',
      ['string', 'bool', 'int', 'float *', 'int *'],
      (...args) => {
        cb(args);
      },
    );
    ffiCb.set(Math.random(), callback);
    Library.setCallback(callback);
    return cb;
  };

  return Library;
};
const anomaly1Dll = anomaly('anomaly');
const anomaly2Dll = anomaly('anomaly2');
export { anomaly1Dll, anomaly2Dll };
