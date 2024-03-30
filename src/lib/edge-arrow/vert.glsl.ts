// language=GLSL
const SHADER_SOURCE = /* glsl */ `
attribute vec2 a_position;
attribute vec2 a_normal;
attribute float a_radius;
attribute vec3 a_barycentric;

#ifdef PICKING_MODE
attribute vec4 a_id;
#else
attribute vec4 a_color;
#endif

uniform mat3 u_matrix;
uniform float u_sizeRatio;
uniform float u_correctionRatio;

varying vec4 v_color;

const float minThickness = 1.7;
const float bias = 255.0 / 254.0;
const float arrowHeadWidthLengthRatio = 0.66;
const float arrowHeadLengthThicknessRatio = 2.5;

void main() {
  float normalLength = length(a_normal);
  vec2 unitNormal = a_normal / normalLength;

  // These first computations are taken from edge.vert.glsl and
  // edge.clamped.vert.glsl. Please read it to get better comments on what's
  // happening:
  float pixelsThickness = max(normalLength, minThickness * u_sizeRatio);
  float webGLThickness = pixelsThickness * u_correctionRatio / u_sizeRatio;
  float webGLNodeRadius = a_radius * 2.0 * u_correctionRatio / u_sizeRatio;
  float webGLArrowHeadLength = webGLThickness * 2.0 * arrowHeadLengthThicknessRatio;
  float webGLArrowHeadHalfWidth = webGLArrowHeadLength * arrowHeadWidthLengthRatio / 2.0;

  float da = a_barycentric.x;
  float db = a_barycentric.y;
  float dc = a_barycentric.z;

  vec2 delta = vec2(
      da * (webGLNodeRadius * unitNormal.y)
    + db * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y + webGLArrowHeadHalfWidth * unitNormal.x)
    + dc * ((webGLNodeRadius + webGLArrowHeadLength) * unitNormal.y - webGLArrowHeadHalfWidth * unitNormal.x),

      da * (-webGLNodeRadius * unitNormal.x)
    + db * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x + webGLArrowHeadHalfWidth * unitNormal.y)
    + dc * (-(webGLNodeRadius + webGLArrowHeadLength) * unitNormal.x - webGLArrowHeadHalfWidth * unitNormal.y)
  );

  vec2 position = (u_matrix * vec3(a_position + delta, 1)).xy;

  gl_Position = vec4(position, 0, 1);

  #ifdef PICKING_MODE
  // For picking mode, we use the ID as the color:
  v_color = a_id;
  #else
  // For normal mode, we use the color:
  v_color = a_color;
  #endif

  v_color.a *= bias;
}
`;

export default SHADER_SOURCE;
