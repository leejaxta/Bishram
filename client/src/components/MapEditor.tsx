// components/MapEditor.tsx
import React, { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

export type MapEditorProps = {
  onLocationSelect: (coords: [number, number], isHomestay: boolean) => void;
  homestayCoords: [number, number];
  attractionCoords: [number, number];
};

const MapEditor: React.FC<MapEditorProps> = ({
  onLocationSelect,
  homestayCoords,
  attractionCoords,
}) => {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const homestayMarkerRef = useRef<L.Marker | null>(null);
  const attractionMarkerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Initialize map
      mapRef.current = L.map(mapContainerRef.current).setView(
        homestayCoords,
        14
      );

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
      }).addTo(mapRef.current);

      // Add homestay marker
      const homestayIcon = L.divIcon({
        className: "custom-div-icon",
        html: `<div style="background-color: #3B82F6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px;">H</div>`,
        iconSize: [30, 30],
        iconAnchor: [15, 15],
      });

      homestayMarkerRef.current = L.marker(homestayCoords, {
        icon: homestayIcon,
        draggable: true,
      })
        .addTo(mapRef.current)
        .bindPopup("Homestay Location")
        .on("dragend", (e) => {
          const newCoords: [number, number] = [
            e.target.getLatLng().lat,
            e.target.getLatLng().lng,
          ];
          onLocationSelect(newCoords, true);
        });

      // Add attraction marker if coordinates are set
      if (attractionCoords[0] !== 0 && attractionCoords[1] !== 0) {
        addAttractionMarker(attractionCoords);
      }

      // Add click handler for the map
      mapRef.current.on("click", (e) => {
        if (e.originalEvent.shiftKey) {
          // Shift+click to set homestay location
          const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
          onLocationSelect(newCoords, true);

          // Update homestay marker
          if (homestayMarkerRef.current) {
            homestayMarkerRef.current.setLatLng(newCoords);
          }
        } else {
          // Regular click to set attraction location
          const newCoords: [number, number] = [e.latlng.lat, e.latlng.lng];
          onLocationSelect(newCoords, false);

          // Update or create attraction marker
          if (attractionMarkerRef.current) {
            attractionMarkerRef.current.setLatLng(newCoords);
          } else {
            addAttractionMarker(newCoords);
          }
        }
      });
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  const addAttractionMarker = (coords: [number, number]) => {
    if (!mapRef.current) return;

    const attractionIcon = L.divIcon({
      className: "custom-div-icon",
      html: `<div style="background-color: #DB5138; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px;">A</div>`,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
    });

    attractionMarkerRef.current = L.marker(coords, {
      icon: attractionIcon,
      draggable: true,
    })
      .addTo(mapRef.current)
      .bindPopup("Attraction Location")
      .on("dragend", (e) => {
        const newCoords: [number, number] = [
          e.target.getLatLng().lat,
          e.target.getLatLng().lng,
        ];
        onLocationSelect(newCoords, false);
      });
  };

  // Update markers when props change
  useEffect(() => {
    if (homestayMarkerRef.current) {
      homestayMarkerRef.current.setLatLng(homestayCoords);
    }
  }, [homestayCoords]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (attractionMarkerRef.current) {
      if (attractionCoords[0] !== 0 && attractionCoords[1] !== 0) {
        attractionMarkerRef.current.setLatLng(attractionCoords);
      } else {
        // Remove attraction marker if coordinates are reset
        mapRef.current.removeLayer(attractionMarkerRef.current);
        attractionMarkerRef.current = null;
      }
    } else if (attractionCoords[0] !== 0 && attractionCoords[1] !== 0) {
      // Create attraction marker if it doesn't exist
      addAttractionMarker(attractionCoords);
    }
  }, [attractionCoords]);

  return (
    <div ref={mapContainerRef} style={{ height: "100%", width: "100%" }} />
  );
};

export default MapEditor;
