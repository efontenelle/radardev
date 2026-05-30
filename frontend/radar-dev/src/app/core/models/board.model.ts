export interface Board {
  name: string;
  columns: BoardColumn[];
  lanes: string[];
}

export interface BoardColumn {
  name: string;
  order: number;
  stateMappings: string;
}
