// pages/attractions.tsx
import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { Button } from "@/components/ui/button";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "leaflet-routing-machine/dist/leaflet-routing-machine.css";
import "leaflet-routing-machine";
import { API_URL } from "@/constants/baseUrl";

type Attraction = {
  _id: string;
  name: string;
  description: string;
  distance: string;
  travelTime: string;
  coords: L.LatLngTuple;
};

export default function Attractions() {
  const mapRefs = useRef<{ [key: string]: L.Map | null }>({});
  const [homestayCoords, setHomestayCoords] = useState<L.LatLngTuple>([
    27.675864552066322, 85.32510050761249,
  ]);
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch attractions
        const attractionsResponse = await fetch(`${API_URL}/api/attractions`);
        if (!attractionsResponse.ok)
          throw new Error("Failed to fetch attractions");
        const attractionsData = await attractionsResponse.json();
        setAttractions(attractionsData);
        console.log(attractionsData);

        // Fetch homestay location
        const homestayResponse = await fetch(
          `${API_URL}/api/attractions/homestay/location`
        );
        if (!homestayResponse.ok)
          throw new Error("Failed to fetch homestay location");
        const homestayData = await homestayResponse.json();
        setHomestayCoords(homestayData.coords);

        setIsLoading(false);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (!attractions.length) return;

    // Initialize maps
    attractions.forEach((attraction) => {
      const mapId = `map-${attraction._id}`;
      const container = document.getElementById(mapId);

      if (container && !mapRefs.current[mapId]) {
        const map = L.map(mapId, {
          zoomControl: true,
          attributionControl: true,
          dragging: true,
          touchZoom: true,
          scrollWheelZoom: true,
          doubleClickZoom: true,
          boxZoom: true,
          keyboard: true,
        }).setView(homestayCoords, 14);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(
          map
        );

        // Create custom icons
        const homestayIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: #3B82F6; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px;">H</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        const attractionIcon = L.divIcon({
          className: "custom-div-icon",
          html: `<div style="background-color: #DB5138; color: white; border-radius: 50%; width: 30px; height: 30px; display: flex; justify-content: center; align-items: center; font-weight: bold; font-size: 12px;">A</div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        // Add markers
        L.marker(homestayCoords, { icon: homestayIcon })
          .addTo(map)
          .bindPopup("<strong>Homestay</strong><br>Jhatapole")
          .openPopup();

        L.marker(attraction.coords, { icon: attractionIcon })
          .addTo(map)
          .bindPopup(
            `<strong>${attraction.name}</strong><br>${attraction.description}`
          )
          .openPopup();

        // Add routing
        L.Routing.control({
          waypoints: [
            L.latLng(homestayCoords[0], homestayCoords[1]),
            L.latLng(attraction.coords[0], attraction.coords[1]),
          ],
          routeWhileDragging: true,
          showAlternatives: true,
          altLineOptions: {
            styles: [{ color: "#9370DB", opacity: 0.6, weight: 4 }],
            extendToWaypoints: false,
            missingRouteTolerance: 0,
          },
          lineOptions: {
            styles: [{ color: "#DB5138", opacity: 0.7, weight: 5 }],
            extendToWaypoints: true,
            missingRouteTolerance: 10,
          },
          addWaypoints: false,
          fitSelectedRoutes: true,
          show: false,
        }).addTo(map);

        mapRefs.current[mapId] = map;
      }
    });

    return () => {
      Object.entries(mapRefs.current).forEach(([id, map]) => {
        if (map) {
          map.remove();
          mapRefs.current[id] = null;
        }
      });
    };
  }, [attractions, homestayCoords]);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!attractions.length) return <div>No attractions found</div>;

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="bg-[#DB5138] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Nearby Attractions
          </h1>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {attractions.map((attraction) => (
            <div
              key={attraction._id}
              className="bg-white rounded-lg overflow-hidden shadow-lg border border-gray-200"
            >
              <div className="bg-gray-100 p-4 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {attraction.name}
                </h2>
                <div className="flex items-center text-sm text-gray-600 mt-1">
                  <svg
                    className="h-4 w-4 mr-1"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  {attraction.travelTime}
                </div>
              </div>

              <div className="z-0 h-96 relative">
                <div
                  id={`map-${attraction._id}`}
                  className="h-full w-full"
                ></div>
                <div className="absolute top-2 right-2 bg-white bg-opacity-90 rounded p-1 text-xs flex items-center">
                  <span className="flex items-center mr-3">
                    <span className="inline-block w-3 h-3 bg-[#3B82F6] rounded-full mr-1"></span>
                    Homestay
                  </span>
                  <span className="flex items-center">
                    <span className="inline-block w-3 h-3 bg-[#DB5138] rounded-full mr-1"></span>
                    {attraction.name}
                  </span>
                </div>
              </div>

              <div className="p-4">
                <p className="text-gray-700 mb-2">{attraction.description}</p>
                <p className="text-sm text-gray-600">{attraction.distance}</p>
              </div>

              <div className="p-4 pt-0 grid grid-cols-2 gap-2">
                <Button className="bg-[#DB5138] hover:bg-[#c0452e] text-white text-sm">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${homestayCoords.join(
                      ","
                    )}&destination=${attraction.coords.join(
                      ","
                    )}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    By Car
                  </a>
                </Button>
                <Button variant="outline" className="text-sm">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${homestayCoords.join(
                      ","
                    )}&destination=${attraction.coords.join(
                      ","
                    )}&travelmode=walking`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full h-full"
                  >
                    By Walking
                  </a>
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}
