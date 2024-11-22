export interface QueryParam {
  recipeId?: number;
  materialId?: string;
  sn?: string;
  startTime?: Date[];
  defectId?: number;
  detectNG?: number;
  affirmNG?: number;
  page: number;
  pageSize: number;
  sort: 'ASC' | 'DESC';
}
