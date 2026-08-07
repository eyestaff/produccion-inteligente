export interface RecordResult {
  id: number;
  name: string;
  value: string;
  created_at: string;
}

export interface PaginatedRecords {
  records: RecordResult[];
  total: number;
}
