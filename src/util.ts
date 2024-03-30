import { colord } from 'colord';

function drawRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

export function drawSimpleNodeLabel(
  context: CanvasRenderingContext2D,
  data: any,
  settings: any,
) {
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;

  // draw rounded background matching color of text
  context.fillStyle = colord(data.color).lighten(0.3).toRgbString();
  drawRoundRect(
    context,
    data.x + data.size + 3 - 2,
    data.y - size / 3 - (size + 8) / 4,
    context.measureText(data.label).width + 4,
    size + 8,
    4,
  );
  context.fill();
  context.closePath();

  context.fillStyle = colord(data.color).darken(0.3).toRgbString();
  context.font = `${weight} ${size}px ${font}`;
  context.fillText(data.label, data.x + data.size + 3, data.y + size / 3);
}

export function drawDetailedNodeLabel(
  context: CanvasRenderingContext2D,
  data: any,
  settings: any,
) {
  const size = settings.labelSize;
  const font = settings.labelFont;
  const weight = settings.labelWeight;
  const subLabelSize = size - 2;

  const label = data.label;
  const subLabel = data.tag !== 'unknown' ? data.tag : '';
  const clusterLabel = data.title;

  // draw circlular outline
  context.beginPath();
  context.arc(data.x, data.y, data.size, 0, 2 * Math.PI);
  context.fillStyle = '#fff';
  context.fill();
  context.lineWidth = 4;
  context.strokeStyle = colord(data.color).darken(0.2).toRgbString();
  context.stroke();
  context.closePath();

  // Then we draw the label background
  context.beginPath();
  context.fillStyle = colord(data.color).lighten(0.3).toRgbString();
  context.shadowOffsetX = 0;
  context.shadowOffsetY = 2;
  context.shadowBlur = 8;
  context.shadowColor = '#000';

  context.font = `${weight} ${size}px ${font}`;
  const labelWidth = context.measureText(label).width;
  context.font = `${weight} ${subLabelSize}px ${font}`;
  const subLabelWidth = subLabel ? context.measureText(subLabel).width : 0;
  context.font = `${weight} ${subLabelSize}px ${font}`;
  const clusterLabelWidth = clusterLabel
    ? context.measureText(clusterLabel).width
    : 0;

  const textWidth = Math.max(labelWidth, subLabelWidth, clusterLabelWidth);

  const x = Math.round(data.x);
  const y = Math.round(data.y);
  const w = Math.round(textWidth + size / 2 + data.size + 3);
  const hLabel = Math.round(size / 2 + 4);
  const hSubLabel = subLabel ? Math.round(subLabelSize / 2 + 9) : 0;
  const hClusterLabel = Math.round(subLabelSize / 2 + 9);

  drawRoundRect(
    context,
    x,
    y - hSubLabel - 12,
    w,
    hClusterLabel + hLabel + hSubLabel + 12,
    5,
  );
  context.closePath();
  context.fill();

  context.shadowOffsetX = 0;
  context.shadowOffsetY = 0;
  context.shadowBlur = 0;

  // And finally we draw the labels
  context.fillStyle = colord(data.color).darken(0.35).toRgbString();
  context.font = `${weight} ${size}px ${font}`;
  context.fillText(label, data.x + data.size + 3, data.y + size / 3);

  context.fillStyle = '#000';
  context.font = `${weight} ${subLabelSize}px ${font}`;
  context.fillText(
    clusterLabel,
    data.x + data.size + 3,
    data.y + size / 3 + 3 + subLabelSize,
  );
}
