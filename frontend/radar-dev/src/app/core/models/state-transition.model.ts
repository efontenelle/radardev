export interface StateTransition {
  fromState: string | null;
  toState: string;
  transitionDate: Date;
  changedBy: string;
}
