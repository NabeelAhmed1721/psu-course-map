import { createEdgeCompoundProgram, EdgeClampedProgram } from 'sigma/rendering';

import EdgeArrowHeadProgram from './edge.arrowHead';

const EdgeArrowProgram = createEdgeCompoundProgram([
  EdgeClampedProgram,
  EdgeArrowHeadProgram,
]);

export default EdgeArrowProgram;
