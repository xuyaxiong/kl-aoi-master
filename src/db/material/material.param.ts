export interface QueryParam {
  recipeId?: number;
  materialId?: string;
  sn?: string;
  startTime?: Date[];
  page: number;
  pageSize: number;
}
