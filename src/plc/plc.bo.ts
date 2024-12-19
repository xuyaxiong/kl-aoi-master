export interface PlcTcpConfig {
  name: string;
  host: string;
  port: number;
}

export interface CapPos {
  x: number;
  y: number;
}

export enum PlcStatus {
  ONLINE = 0,
  OFFLINE = 1,
}
