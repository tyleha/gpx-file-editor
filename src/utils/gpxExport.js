/**
 * Rebuilds the original GPX XML document with only the current (surviving) points.
 * Deleted trkpt elements are removed; time elements on shifted points are updated.
 * All other content (metadata, track name, extensions, namespaces) is left untouched.
 */
export function buildExportXml(originalXml, currentPoints) {
  const doc = new DOMParser().parseFromString(originalXml, 'application/xml');
  const trkpts = Array.from(doc.querySelectorAll('trkpt'));

  // Map originalIndex → current point so we can look up surviving points and their (possibly shifted) times.
  const survivingByOrigIdx = new Map(currentPoints.map(pt => [pt.originalIndex, pt]));

  // Iterate in reverse so removing a node doesn't affect the indices of earlier nodes.
  for (let i = trkpts.length - 1; i >= 0; i--) {
    const current = survivingByOrigIdx.get(i);
    if (!current) {
      trkpts[i].parentNode.removeChild(trkpts[i]);
    } else if (current.time) {
      const timeEl = trkpts[i].querySelector('time');
      if (timeEl) timeEl.textContent = current.time;
    }
  }

  return new XMLSerializer().serializeToString(doc);
}

export function downloadGpx(xml, filename) {
  const blob = new Blob([xml], { type: 'application/gpx+xml' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
