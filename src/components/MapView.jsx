import { useRef, useEffect } from "react";
import { MapContainer, TileLayer, Polyline, CircleMarker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
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

function DraggablePoints({ points, showPoints, selectMode, selectedIndices, onMovePoint }) {
  const map = useMap();
  const state = useRef({ onMovePoint, active: false, index: null, marker: null });

  useEffect(() => {
    state.current.onMovePoint = onMovePoint;
  });

  useEffect(() => {
    const onMouseMove = (e) => {
      if (!state.current.active) return;
      state.current.marker?.setLatLng(e.latlng);
    };

    const onMouseUp = (e) => {
      if (!state.current.active) return;
      state.current.active = false;
      map.dragging.enable();
      if (state.current.marker) {
        map.removeLayer(state.current.marker);
        state.current.marker = null;
      }
      const idx = state.current.index;
      state.current.index = null;
      const moved = e.containerPoint.distanceTo(state.current.startPoint) > 5;
      if (moved) state.current.onMovePoint(idx, e.latlng.lat, e.latlng.lng);
    };

    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);
    return () => {
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      if (state.current.active) {
        map.dragging.enable();
        if (state.current.marker) {
          map.removeLayer(state.current.marker);
          state.current.marker = null;
        }
        state.current.active = false;
      }
    };
  }, [map]);

  if (!showPoints) return null;

  return points.map((pt, i) => {
    const isSelected = selectedIndices.has(i);

    const handleMouseDown = (e) => {
      if (selectMode) return;
      map.dragging.disable();
      state.current.active = true;
      state.current.index = i;
      state.current.startPoint = e.containerPoint;
      state.current.marker = L.circleMarker([pt.lat, pt.lon], {
        radius: 6,
        color: '#ff8800',
        fillColor: '#ff8800',
        fillOpacity: 1,
        interactive: false,
      }).addTo(map);
    };

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
        eventHandlers={{ mousedown: handleMouseDown }}
      >
        {!selectMode && (
          <Popup>
            <pre style={{ margin: 0, fontSize: "0.75rem" }}>{formatExtensions(pt)}</pre>
          </Popup>
        )}
      </CircleMarker>
    );
  });
}

export default function MapView({ track, showPoints, selectMode, selectedIndices, onSelect, onMovePoint }) {
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
      <DraggablePoints
        points={track.points}
        showPoints={showPoints}
        selectMode={selectMode}
        selectedIndices={selectedIndices}
        onMovePoint={onMovePoint}
      />
    </MapContainer>
  );
}
