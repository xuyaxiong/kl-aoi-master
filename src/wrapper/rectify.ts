const FFI = require('ffi-napi');
import AppConfig from '../app.config';
const DLL_PATH = AppConfig.DLL_PATH;

const ffiCb = new Map();

export const rectify = () => {
  const pathArray = process.env.PATH.split(';');
  pathArray.unshift(DLL_PATH);
  process.env.PATH = pathArray.join(';');
  
  const Library = new FFI.Library(DLL_PATH + 'rectify', {
    estimateAccuratePositionCoor: [
      'int',
      [
        'uchar*',
        'uchar*',
        'int',
        'int',
        'int',
        'char*',
        'char*',
        'int*',
        'int*',
        'double*',
        'double*',
        'double *',
        'double *',
        'double *',
        'double*',
      ],
    ],

    transformBiaxial: [
      'int',
      ['int', 'double*', 'double*', 'double*', 'double*'],
    ],

    initMosaic: ['int', ['char*', 'double', 'double*']],

    updateMosaic: ['int', ['char*', 'uchar*', 'int', 'int', 'int', 'double*']],

    saveMosaic: ['int', ['char*', 'char*', 'bool']],

    freeMosaic: ['int', ['char*']],

    transformWorld: [
      'int',
      ['int', 'double*', 'double*', 'double*', 'double*', 'double*'],
    ],

    transformInvWorldCenter: [
      'int',
      ['int', 'double*', 'double*', 'double*', 'double*'],
    ],

    getFullTransform: [
      'int',
      ['double*', 'double*', 'double*', 'double*', 'double*', 'double*'],
    ],

    transformMapping: ['int', ['int', 'double *', 'double *', 'double *']],

    calculateChipsCoor: [
      'int',
      [
        'int',
        'uchar*',
        'int',
        'int',
        'int',
        'string',
        'double*',
        'double*',
        'double*',
        'double*',
        'double*',
        'int',
        'double*',
        'int',
        'double*',
        'double',
        'double*',
      ],
    ],

    transformInvMapping: ['int', ['int', 'double *', 'double *', 'double *']],

    transformInvWorld: [
      'int',
      ['int', 'double *', 'double *', 'double *', 'double *', 'double *'],
    ],
    readDetectRegionInfo: [
      'int',
      ['uchar*', 'int', 'int', 'int', 'int*', 'double**'],
    ],

    setMeasureCallback: ['bool', ['pointer']],

    get_dll_version: ['string', []],
  });

  Library.addMeasureListener = (cb) => {
    const callback = FFI.Callback(
      'void',
      ['int', 'uchar*', 'int', 'int', 'int', 'double*', 'double*', 'int'],
      (...args) => {
        cb(args);
      },
    );
    ffiCb.set(Math.random(), callback);
    Library.setMeasureCallback(callback);
    return cb;
  };

  return Library;
};
const rectifyDll = rectify();
export default rectifyDll;
