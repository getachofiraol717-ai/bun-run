// Smart PDF Engine — Table types (Feature 6)

export type TableType = "data" | "comparison" | "research" | "formula_table" | "unknown";

export interface PDFTable {
  id: string;
  tableType: TableType;
  caption: string | null;
  pageNumber: number;
  headers: string[];
  rows: string[][];
  /** 0–1 confidence that this text block is actually a table (column-alignment heuristic). */
  confidence: number;
}
