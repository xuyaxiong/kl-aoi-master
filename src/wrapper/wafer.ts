const FFI = require('ffi-napi');
const path = require('path');
import AppConfig from '../app.config';
const DLL_PATH = AppConfig.DLL_PATH;

const callbackMap = new Map();

const wafer = () => {
  const pathArray = process.env.PATH.split(';');
  pathArray.unshift(DLL_PATH);
  process.env.PATH = pathArray.join(';');

  const Library = new FFI.Library(path.join(DLL_PATH, 'wafer.dll'), {
    init_camera: ['int', ['string']],
    camera_type: ['string', ['int']],
    camera_model: ['string', ['int']],
    camera_sn: ['string', ['int']],
    camera_size: ['int', ['int', 'int *', 'int *', 'int *']],
    close_all_cameras: ['void', []],

    get_exposure_time: ['int', ['int', 'float*']],
    set_exposure_time: ['int', ['int', 'float']],

    mock_camera_script: ['int', ['string']],
    mock_camera: ['int', ['string']],

    grab_once: ['int', ['int', 'pointer', 'void *']],
    grab_internal: ['int', ['int', 'pointer', 'void *']],
    grab_external: ['int', ['int', 'pointer', 'void *']],
    grab_stop: ['int', ['int']],

    camera_undistort: ['int', ['int', 'double*']],

    subscribe_backend: ['int', ['string']],

    free_img: ['void', ['uchar*']],
    free_ptr: ['void', ['void *']],
  });

  Library.grabCb = (callback) => {
    const cb = FFI.Callback(
      'void',
      ['int64', 'uchar*', 'int', 'int', 'int', 'void*'],
      (...arg) => {
        callback(...arg);
      },
    );
    callbackMap.set(Math.random(), cb);
    return cb;
  };

  return Library;
};
const waferDll = wafer();
export default waferDll;
