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

export interface GetMapCsvResultParam {
  csv: string;
}

export interface SaveFullImgParam {
  materialId: string;
  patternId: number;
  unit: number;
}
