import { MapContainer, TileLayer, Polyline, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import SelectionControl from "./SelectionControl";

function formatExtensions(pt) {
  const lines = [];
  if (pt.time) lines.push(`time: ${new Date(pt.time).toLocaleString()}`);
  if (pt.ele != null) lines.push(`ele: ${pt.ele.toFixed(1)} m`);
  for (const [k, v] of Object.entries(pt.extensions)) {
    lines.push(`${k}: ${v}`);
  }
  return lines.join("\n");
}

export default function MapView({ track, showPoints, selectMode, selectedIndices, onSelect }) {
  const positions = track.points.map((p) => [p.lat, p.lon]);

  if (positions.length === 0) return null;

  const center = positions[Math.floor(positions.length / 2)];

  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        maxNativeZoom={19}
        maxZoom={23}
      />
      <SelectionControl active={selectMode} onSelect={onSelect} />
      <Polyline positions={positions} pathOptions={{ color: "red", weight: 3 }} />
      {showPoints &&
        track.points.map((pt, i) => {
          const isSelected = selectedIndices.has(i);
          return (
            <CircleMarker
              key={i}
              center={[pt.lat, pt.lon]}
              radius={4}
              pathOptions={
                isSelected
                  ? { color: "#ff8800", fillColor: "#ff8800", fillOpacity: 1 }
                  : { color: "red", fillColor: "red", fillOpacity: 1 }
              }
            >
              {!selectMode && (
                <Popup>
                  <pre style={{ margin: 0, fontSize: "0.75rem" }}>{formatExtensions(pt)}</pre>
                </Popup>
              )}
            </CircleMarker>
          );
        })}
    </MapContainer>
  );
}
