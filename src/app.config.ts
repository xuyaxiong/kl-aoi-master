const AppConfig = {
  DLL_PATH: 'D:\\kl-storage\\dll\\', // dll路径
  BASE_MATERIAL_OUTPUT_PATH: 'D:\\kl-storage\\record', // 物料路径
  BASE_CUSTOMER_OUTPUT_PATH: 'D:\\kl-storage\\record', // 导出数据路径
  CRASH_DUMP_DIR: 'D:\\kl-storage\\crashDump\\aoi-master', // dll崩溃dump文件保存路径
  APP_LOG_DIR: 'D:\\kl-storage\\app-logs\\aoi-master', // 服务日志保存路径
  TMP_DIR: 'D:\\tmp', // 临时文件夹

  measureRemoteCfg: {
    host: 'http://127.0.0.1',
    port: 3100,
  },
  anomalyRemoteCfg: {
    host: 'http://127.0.0.1',
    port: 3200,
  },
};
export default AppConfig;