import { LightType, DetectType } from 'src/detect/detect.bo';

export default () => ({
  detectCamType: 'Hik',
  undistortParams: [
    316620.2744931842, 316800.844462945, 2518.324205873608, 2566.707832693061,
    5, 13.23828121483488, -0.02742307931458463, 0.02139915665827405,
    -0.00239816749474035, -2.202294417911529e-6, 0, 0, 0, 0, 0, 0, 0, 0, 0,
  ],
  plcTcpConfig: {
    name: 'PLC通信',
    host: '127.0.0.1',
    port: 7777,
  },
  detectCfgSeq: [
    {
      lightType: LightType.COAXIAL,
      detectTypeList: [DetectType.ANOMALY, DetectType.MEASURE],
    },
    {
      lightType: LightType.RING,
      detectTypeList: [DetectType.ANOMALY],
    },
  ],
  measureRemoteCfg: {
    host: 'http://127.0.0.1',
    port: 3100,
  },
  anomalyRemoteCfg: {
    host: 'http://127.0.0.1',
    port: 3200,
  },
});
