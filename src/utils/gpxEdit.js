export function deleteSelectedPoints(points, selectedIndices) {
  const selected = new Set(selectedIndices);
  const newPoints = [];
  let shiftMs = 0;
  let i = 0;

  while (i < points.length) {
    if (!selected.has(i)) {
      const pt = { ...points[i] };
      if (pt.time && shiftMs > 0) {
        pt.time = new Date(new Date(pt.time).getTime() - shiftMs).toISOString();
      }
      newPoints.push(pt);
      i++;
    } else {
      // Find the end of this contiguous group of deleted points
      const groupStart = i;
      while (i < points.length && selected.has(i)) i++;

      // i is now the first surviving point after the group
      if (i < points.length && points[groupStart].time && points[i].time) {
        shiftMs += new Date(points[i].time).getTime() - new Date(points[groupStart].time).getTime();
      }
    }
  }

  return newPoints;
}
