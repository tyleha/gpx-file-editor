function parseExtensions(el) {
  const result = {};
  const ext = el.querySelector("extensions");
  if (!ext) return result;
  const walk = (node, prefix = "") => {
    for (const child of Array.from(node.children)) {
      const key = prefix ? `${prefix}.${child.localName}` : child.localName;
      if (child.children.length === 0) {
        result[key] = child.textContent?.trim() ?? "";
      } else {
        walk(child, key);
      }
    }
  };
  walk(ext);
  return result;
}

export function parseGpx(xml) {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const name = doc.querySelector("trk > name")?.textContent?.trim();
  const trkpts = Array.from(doc.querySelectorAll("trkpt"));

  const points = trkpts.map((pt, i) => ({
    originalIndex: i,
    lat: parseFloat(pt.getAttribute("lat") ?? "0"),
    lon: parseFloat(pt.getAttribute("lon") ?? "0"),
    ele: pt.querySelector("ele") ? parseFloat(pt.querySelector("ele").textContent ?? "0") : undefined,
    time: pt.querySelector("time")?.textContent?.trim(),
    extensions: parseExtensions(pt),
  }));

  return { name, points };
}
