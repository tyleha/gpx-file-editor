import { useEffect, useRef } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';

export default function SelectionControl({ active, onSelect }) {
  const map = useMap();

  // Keep mutable state in a ref so event handlers always see the latest values
  // without needing to re-register on every render.
  const s = useRef({ active, onSelect, startLatlng: null, rect: null });
  useEffect(() => {
    s.current.active = active;
    s.current.onSelect = onSelect;
  });

  // Remove the rectangle and re-enable dragging when select mode is turned off.
  useEffect(() => {
    if (!active) {
      if (s.current.rect) {
        map.removeLayer(s.current.rect);
        s.current.rect = null;
      }
      s.current.startLatlng = null;
      map.dragging.enable();
    }
  }, [active, map]);

  useEffect(() => {
    const onMouseDown = (e) => {
      if (!s.current.active) return;
      map.dragging.disable();
      s.current.startLatlng = e.latlng;
      if (s.current.rect) map.removeLayer(s.current.rect);
      s.current.rect = L.rectangle([e.latlng, e.latlng], {
        color: '#3388ff',
        weight: 2,
        fillOpacity: 0.15,
        interactive: false,
      }).addTo(map);
    };

    const onMouseMove = (e) => {
      if (!s.current.active || !s.current.startLatlng) return;
      s.current.rect?.setBounds(L.latLngBounds(s.current.startLatlng, e.latlng));
    };

    const onMouseUp = (e) => {
      if (!s.current.active || !s.current.startLatlng) return;
      const bounds = L.latLngBounds(s.current.startLatlng, e.latlng);
      map.dragging.enable();
      s.current.startLatlng = null;
      s.current.onSelect(bounds);
      // Leave rect visible to show current selection area
    };

    map.on('mousedown', onMouseDown);
    map.on('mousemove', onMouseMove);
    map.on('mouseup', onMouseUp);

    return () => {
      map.off('mousedown', onMouseDown);
      map.off('mousemove', onMouseMove);
      map.off('mouseup', onMouseUp);
      map.dragging.enable();
      if (s.current.rect) {
        map.removeLayer(s.current.rect);
        s.current.rect = null;
      }
    };
  }, [map]);

  return null;
}
