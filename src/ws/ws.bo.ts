export interface PublishData {
  event: string;
  name?: string;
  state: string | number;
  info?: object;
}

export interface SubscribeData {
  channel: string;
  data: object;
}
