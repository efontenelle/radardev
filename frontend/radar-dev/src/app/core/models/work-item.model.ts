export interface WorkItem {
  id: number;
  title: string;
  type: string;
  state: string;
  createdDate: Date;
  changedDate?: Date;
}
