export interface Trend {
  title: string;
  description: string;
  source: string;
}

export interface EmergingTrend {
  title: string;
  description: string;
  horizon: string;
  source: string;
}

export interface Resource {
  name: string;
  url: string;
}

export interface UpskillingStep {
  step: number;
  skill: string;
  why: string;
  timeframe: string;
  resource: Resource;
}

export interface DorothyMove {
  skill: string;
  rationale: string;
  resource: Resource;
}

export interface Report {
  summary: string;
  currentTrends: Trend[];
  emergingTrends: EmergingTrend[];
  aiImpact: string;
  skillGap: {
    haveLikely: string[];
    becomingValuable: string[];
  };
  upskillingPath: UpskillingStep[];
  dorothyMove: DorothyMove;
}
