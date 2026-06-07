export type NodeCat = "external" | "entry" | "detail" | "tool" | "parallel" | "config" | "output";

export type GraphNodeData = {
  id: string;
  label: string;
  cat: NodeCat | string;
  role: string;
  desc: string;
  x: number;
  y: number;
};

export type GraphConnection = {
  from: string;
  to: string;
  type: "normal" | "dashed" | "par" | string;
  label?: string;
};

export type FlowStep = {
  n: number;
  text: string;
  detail: string;
  exec: "claude" | "sub" | string;
};

export type SkillFlow = {
  id: string;
  name: string;
  desc: string;
  nodes: string[];
  conns: string[];
  steps: FlowStep[];
};

export type Diagram = {
  _id?: string;
  title: string;
  sourceName: string;
  summary: string;
  nodes: GraphNodeData[];
  connections: GraphConnection[];
  flows: SkillFlow[];
  updatedAt?: number;
};

export type AppUser = {
  email: string;
  name: string;
  workosUserId: string;
  isDemo: boolean;
  role: "admin" | "member";
};
