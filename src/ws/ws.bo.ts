export interface PublishData {
  event: string;
  state: string;
  info: object;
}

export interface SubscribeData {
  channel: string;
  data: object;
}
