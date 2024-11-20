const FFI = require('ffi-napi');
const path = require('path');
import AppConfig from '../app.config';
const DLL_PATH = AppConfig.DLL_PATH;

const shmem = () => {
  let pathArray = process.env.PATH.split(';');
  pathArray.unshift(DLL_PATH);
  process.env.PATH = pathArray.join(';');

  const Library = new FFI.Library(path.join(DLL_PATH, 'shmem.dll'), {
    crop: [
      'void',
      ['uchar *', 'int', 'int', 'int', 'int', 'uchar *', 'int', 'int', 'int'],
    ],

    paste: [
      'void',
      ['uchar *', 'int', 'int', 'int', 'int', 'uchar *', 'int', 'int', 'int'],
    ],

    imread: ['bool', ['string', 'uchar *', 'int', 'int', 'int', 'bool']],

    imwrite: ['void', ['string', 'uchar *', 'int', 'int', 'int', 'bool']],

    imwrite_async: ['void', ['string', 'uchar *', 'int', 'int', 'int', 'bool']],
  });
  return Library;
};
const shmemDll = shmem();
export default shmemDll;
