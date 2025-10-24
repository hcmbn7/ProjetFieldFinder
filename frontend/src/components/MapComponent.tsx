import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { SoccerField } from '../types';

// Fix Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  fields: SoccerField[];
  onFieldClick: (field: SoccerField) => void;
  selectedField?: SoccerField;
}


const MapComponent: React.FC<MapComponentProps> = ({ fields, onFieldClick, selectedField }) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [45.5017, -73.5673],
      zoom: 11,
      zoomControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    fields.forEach(field => {
      const [lat, lng] = field.coordinates || [];

      if (!lat || !lng) return;

      const icon = L.divIcon({
        html: `
          <div class="soccer-field-marker ${selectedField?.id === field.id ? 'selected' : ''}">
            <div class="marker-icon">⚽</div>
            <div class="marker-label">${field.name}</div>
          </div>
        `,
        className: 'custom-marker',
        iconSize: undefined,
        iconAnchor: [60, 40],
      });

      const marker = L.marker([lat, lng], { icon }).addTo(mapRef.current!);

      marker.on('click', () => onFieldClick(field));
      markersRef.current.push(marker);
    });

    if (fields.length > 0) {
      const group = L.featureGroup(markersRef.current);
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
  }, [fields, onFieldClick, selectedField]);

  useEffect(() => {
    if (!mapRef.current || !selectedField?.coordinates) return;

    const [lat, lng] = selectedField.coordinates;
    mapRef.current.setView([lat, lng], 14, {
      animate: true,
      duration: 0.5
    });
  }, [selectedField]);

  return (
    <div className="relative w-full h-full">
      <div
        ref={mapContainerRef}
        className="w-full h-full rounded-xl border-4 border-emerald-500 shadow-md"
      />
      <style>{`
        .soccer-field-marker {
          background: white;
          border: 2px solid #10b981;
          border-radius: 20px;
          padding: 4px 8px;
          font-size: 12px;
          font-weight: 600;
          color: #065f46;
          text-align: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
          transition: all 0.2s ease;
          cursor: pointer;
          white-space: nowrap;
        }
        .soccer-field-marker:hover {
          background: #10b981;
          color: white;
          transform: scale(1.05);
        }
        .soccer-field-marker.selected {
          background: #10b981;
          color: white;
          border-color: #047857;
        }
        .marker-icon {
          font-size: 14px;
          margin-bottom: 2px;
        }
        .marker-label {
          font-size: 10px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
