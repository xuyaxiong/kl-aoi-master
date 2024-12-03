export interface publishData {
  event: string;
  state: string;
  info: object;
}

export interface subscribeData {
  channel: string;
  data: object;
}
