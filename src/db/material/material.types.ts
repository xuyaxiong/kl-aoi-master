export interface PageInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPage: number;
}

export interface PageRes<T> {
  items: T[];
  pageInfo: PageInfo;
}
