import React, { useCallback, useEffect, useRef } from 'react';
import L from 'leaflet';
import { SoccerField } from '../types';

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
  const markersRef = useRef<Array<{ marker: L.Marker, field: SoccerField }>>([]);
  const PREVIEW_ZOOM_THRESHOLD = 14;

  const updatePreviewVisibility = useCallback(() => {
    if (!mapRef.current) return;

    const shouldShow = mapRef.current.getZoom() >= PREVIEW_ZOOM_THRESHOLD;
    markersRef.current.forEach(({ marker }) => {
      if (shouldShow) {
        marker.openTooltip();
      } else {
        marker.closeTooltip();
      }
    });
  }, []);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    mapRef.current = L.map(mapContainerRef.current, {
      center: [45.5017, -73.5673],
      zoom: 11,
      zoomControl: true,
    });

    const mapInstance = mapRef.current;

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(mapInstance);

    mapInstance.on('zoomend', updatePreviewVisibility);

    return () => {
      mapRef.current?.off('zoomend', updatePreviewVisibility);
      mapRef.current?.remove();
      mapRef.current = null;
    };
  }, [updatePreviewVisibility]);

  useEffect(() => {
    if (!mapRef.current) return;

    markersRef.current.forEach(({ marker }) => marker.remove());
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

      marker.bindTooltip(
        `
          <div class="field-preview">
            <div class="field-preview-label">Format</div>
            <div class="field-preview-value">${field.format || '—'}</div>
            <div class="field-preview-divider"></div>
            <div class="field-preview-label">Surface</div>
            <div class="field-preview-value">${field.surface_type || '—'}</div>
          </div>
        `,
        {
          direction: 'top',
          offset: [0, -36],
          opacity: 1,
          className: 'field-preview-tooltip',
        }
      );

      marker.on('click', () => onFieldClick(field));
      markersRef.current.push({ marker, field });
    });

    if (markersRef.current.length > 0) {
      const group = L.featureGroup(markersRef.current.map(({ marker }) => marker));
      mapRef.current.fitBounds(group.getBounds().pad(0.1));
    }
    updatePreviewVisibility();
  }, [fields, onFieldClick, selectedField, updatePreviewVisibility]);

  useEffect(() => {
    if (!mapRef.current || !selectedField?.coordinates) return;

    const [lat, lng] = selectedField.coordinates;
    const targetZoom = Math.max(mapRef.current.getZoom(), PREVIEW_ZOOM_THRESHOLD);
    mapRef.current.setView([lat, lng], targetZoom, {
      animate: true,
      duration: 0.5
    });
    if (targetZoom >= PREVIEW_ZOOM_THRESHOLD) {
      updatePreviewVisibility();
    }
  }, [selectedField, updatePreviewVisibility]);

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
        .field-preview-tooltip {
          background: transparent;
          border: none;
          box-shadow: none;
          padding: 0;
        }
        .field-preview {
          background: rgba(255, 255, 255, 0.95);
          border: 1px solid rgba(16, 185, 129, 0.3);
          border-radius: 12px;
          padding: 8px 10px;
          min-width: 120px;
          box-shadow: 0 6px 16px rgba(15, 118, 110, 0.15);
          text-align: left;
        }
        .field-preview-label {
          font-size: 11px;
          font-weight: 600;
          color: #047857;
        }
        .field-preview-value {
          font-size: 13px;
          color: #0f172a;
        }
        .field-preview-divider {
          height: 1px;
          margin: 6px 0;
          background: rgba(16, 185, 129, 0.25);
        }
      `}</style>
    </div>
  );
};

export default MapComponent;
