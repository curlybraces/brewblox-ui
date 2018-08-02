type ProcessViewPartType =
  'TUBE_STRAIGHT' |
  'TUBE_INPUT' |
  'TUBE_OUTPUT' |
  'TUBE_TEE' |
  'TUBE_ELBOW' |
  'VALVE';

type ProcessViewPart = {
  type: ProcessViewPartType;
  x: number;
  y: number;
  rotate: number;
};

type ProcessViewPartFlow = {
  out: number,
  friction?: number,
  pressure?: number,
};

type ProcessViewPartFlows = {
  [angleIn: number]: ProcessViewPartFlow[];
};

type ProcessViewPartCalculatedFlow = { [angle: number]: number };

type ProcessViewPartWithComponent = {
  component: {
    isSource?: boolean;
    isSink?: boolean;
    flows: () => ProcessViewPartFlows;
  };
  flowingFrom: number[],
  flowingTo: number[],
  flow?: ProcessViewPartCalculatedFlow;
  visited?: boolean;
} & ProcessViewPart;
