/**
 * Sigma.js WebGL Renderer Arrow Program
 * ======================================
 *
 * Program rendering direction arrows as a simple triangle.
 * @module
 */
import { Attributes } from 'graphology-types';
import { EdgeProgram, type ProgramInfo } from 'sigma/rendering';
import {
  type EdgeDisplayData,
  type NodeDisplayData,
  type RenderParams,
} from 'sigma/types';
import { floatColor } from 'sigma/utils';

import FRAGMENT_SHADER_SOURCE from './frag.glsl';
import VERTEX_SHADER_SOURCE from './vert.glsl';

const { UNSIGNED_BYTE, FLOAT } = WebGLRenderingContext;

const UNIFORMS = ['u_matrix', 'u_sizeRatio', 'u_correctionRatio'] as const;

export default class EdgeArrowHeadProgram<
  N extends Attributes = Attributes,
  E extends Attributes = Attributes,
  G extends Attributes = Attributes,
> extends EdgeProgram<(typeof UNIFORMS)[number], N, E, G> {
  getDefinition() {
    return {
      VERTICES: 3,
      VERTEX_SHADER_SOURCE,
      FRAGMENT_SHADER_SOURCE,
      METHOD: WebGLRenderingContext.TRIANGLES,
      UNIFORMS,
      ATTRIBUTES: [
        { name: 'a_position', size: 2, type: FLOAT },
        { name: 'a_normal', size: 2, type: FLOAT },
        { name: 'a_radius', size: 1, type: FLOAT },
        { name: 'a_color', size: 4, type: UNSIGNED_BYTE, normalized: true },
        { name: 'a_id', size: 4, type: UNSIGNED_BYTE, normalized: true },
      ],
      CONSTANT_ATTRIBUTES: [{ name: 'a_barycentric', size: 3, type: FLOAT }],
      CONSTANT_DATA: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    };
  }

  processVisibleItem(
    edgeIndex: number,
    startIndex: number,
    sourceData: NodeDisplayData,
    targetData: NodeDisplayData,
    data: EdgeDisplayData,
  ) {
    const thickness = data.size * 3 || 1;
    const radius = targetData.size || 1;
    const x1 = sourceData.x;
    const y1 = sourceData.y;
    const x2 = targetData.x;
    const y2 = targetData.y;
    const color = floatColor(data.color);

    // Computing normals
    const dx = x2 - x1;
    const dy = y2 - y1;

    let len = dx * dx + dy * dy;
    let n1 = 0;
    let n2 = 0;

    if (len) {
      len = 1 / Math.sqrt(len);

      n1 = -dy * len * thickness;
      n2 = dx * len * thickness;
    }

    const array = this.array;

    array[startIndex++] = x2;
    array[startIndex++] = y2;
    array[startIndex++] = -n1;
    array[startIndex++] = -n2;
    array[startIndex++] = radius;
    array[startIndex++] = color;
    array[startIndex++] = edgeIndex;
  }

  setUniforms(
    params: RenderParams,
    { gl, uniformLocations }: ProgramInfo,
  ): void {
    // eslint-disable-next-line camelcase
    const { u_matrix, u_sizeRatio, u_correctionRatio } = uniformLocations;

    gl.uniformMatrix3fv(u_matrix, false, params.matrix);
    gl.uniform1f(u_sizeRatio, params.sizeRatio);
    gl.uniform1f(u_correctionRatio, params.correctionRatio);
  }
}
