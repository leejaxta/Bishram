import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import "leaflet/dist/leaflet.css";
import { MapEditorProps } from "@/components/MapEditor";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { API_URL } from "@/constants/baseUrl";
// Client-side only component
// let MapEditor;
// if (typeof window !== 'undefined') {
//   MapEditor = require('@/components/MapEditor').default;
// }

type Attraction = {
  _id?: string;
  name: string;
  description: string;
  distance: string;
  travelTime: string;
  coords: [number, number];
};

const AdminAttractionsPage = () => {
  const [homestayCoords, setHomestayCoords] = useState<[number, number]>([
    27.675864552066322, 85.32510050761249,
  ]);
  const [MapEditor, setMapEditor] =
    useState<React.ComponentType<MapEditorProps> | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [attraction, setAttraction] = useState<Attraction>({
    name: "",
    description: "",
    distance: "",
    travelTime: "",
    coords: [0, 0],
  });
  const [attractions, setAttractions] = useState<Attraction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    if (typeof window !== "undefined") {
      import("@/components/MapEditor").then((module) => {
        setMapEditor(() => module.default);
      });
    }
    const fetchData = async () => {
      try {
        setIsLoading(true);

        const attractionsResponse = await fetch(`${API_URL}/api/attractions`);
        if (!attractionsResponse.ok)
          throw new Error("Failed to fetch attractions");
        const attractionsData = await attractionsResponse.json();
        setAttractions(attractionsData);
        console.log(attractionsData);

        const homestayResponse = await fetch(
          `${API_URL}/api/attractions/homestay/location`
        );
        if (!homestayResponse.ok)
          throw new Error("Failed to fetch homestay location");
        const homestayData = await homestayResponse.json();
        setHomestayCoords(homestayData.coords);

        setError(null);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "An unknown error occurred"
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);

      if (editingId) {
        const response = await fetch(
          `${API_URL}/api/attractions/${editingId}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(attraction),
          }
        );

        if (!response.ok) throw new Error("Failed to update attraction");

        setAttractions((prev) =>
          prev.map((item) =>
            item._id === editingId ? { ...attraction, id: editingId } : item
          )
        );
      } else {
        const response = await fetch(`${API_URL}/api/attractions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(attraction),
        });

        if (!response.ok) throw new Error("Failed to create attraction");

        const newAttraction = await response.json();
        setAttractions((prev) => [...prev, newAttraction]);
      }

      resetForm();
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (attraction: Attraction) => {
    setAttraction(attraction);
    setEditingId(attraction._id!);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this attraction?")) return;

    try {
      setIsLoading(true);
      const response = await fetch(`${API_URL}/api/attractions/${id}`, {
        method: "DELETE",
      });
      console.log(id);

      if (!response.ok) throw new Error("Failed to delete attraction");

      setAttractions((prev) => prev.filter((item) => item._id !== id));
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setAttraction({
      name: "",
      description: "",
      distance: "",
      travelTime: "",
      coords: [0, 0],
    });
    setEditingId(null);
  };

  const handleLocationSelect = async (
    coords: [number, number],
    isHomestay = false
  ) => {
    try {
      if (isHomestay) {
        const response = await fetch(
          `${API_URL}/api/attractions/homestay/location`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ coords }),
          }
        );

        if (!response.ok) throw new Error("Failed to update homestay location");

        setHomestayCoords(coords);
      } else {
        setAttraction((prev) => ({
          ...prev,
          coords,
        }));
      }
      setError(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An unknown error occurred"
      );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Sidebar />
      <div className="ml-[338px] container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Manage Attractions</h1>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">
              {editingId ? "Edit Attraction" : "Add New Attraction"}
            </h2>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Name</label>
                <Input
                  type="text"
                  value={attraction.name}
                  onChange={(e) =>
                    setAttraction({ ...attraction, name: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Description
                </label>
                <Textarea
                  value={attraction.description}
                  onChange={(e) =>
                    setAttraction({
                      ...attraction,
                      description: e.target.value,
                    })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Distance
                </label>
                <Input
                  type="text"
                  value={attraction.distance}
                  onChange={(e) =>
                    setAttraction({ ...attraction, distance: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Travel Time
                </label>
                <Input
                  type="text"
                  value={attraction.travelTime}
                  onChange={(e) =>
                    setAttraction({ ...attraction, travelTime: e.target.value })
                  }
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Location Coordinates
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={attraction.coords[0]}
                    onChange={(e) =>
                      setAttraction({
                        ...attraction,
                        coords: [
                          parseFloat(e.target.value),
                          attraction.coords[1],
                        ],
                      })
                    }
                    placeholder="Latitude"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={attraction.coords[1]}
                    onChange={(e) =>
                      setAttraction({
                        ...attraction,
                        coords: [
                          attraction.coords[0],
                          parseFloat(e.target.value),
                        ],
                      })
                    }
                    placeholder="Longitude"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Or select location on the map
                </p>
              </div>

              <div className="flex gap-2">
                <Button
                  type="submit"
                  className="bg-[#DB5138] hover:bg-[#c0452e]"
                  disabled={isLoading}
                >
                  {isLoading ? "Processing..." : editingId ? "Update" : "Add"}{" "}
                  Attraction
                </Button>
                {editingId && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={resetForm}
                    disabled={isLoading}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </form>

            {/* Homestay Location Section */}
            <div className="mt-8 pt-6 border-t">
              <h2 className="text-xl font-semibold mb-4">Homestay Location</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">
                  Current Coordinates
                </label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    step="any"
                    value={homestayCoords[0]}
                    readOnly
                    placeholder="Latitude"
                  />
                  <Input
                    type="number"
                    step="any"
                    value={homestayCoords[1]}
                    readOnly
                    placeholder="Longitude"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Click on the map to update homestay location
                </p>
              </div>
            </div>
          </div>

          {/* Map Section */}
          <div className="z-0 bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Map Selector</h2>
            <div className=" h-96 rounded-md overflow-hidden">
              {isClient && MapEditor ? (
                <MapEditor
                  onLocationSelect={handleLocationSelect}
                  homestayCoords={homestayCoords}
                  attractionCoords={attraction.coords}
                />
              ) : (
                <div className="h-full flex items-center justify-center bg-gray-100">
                  <p>Map loading...</p>
                </div>
              )}
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Click on the map to select location.
              <span className="font-medium"> Shift+Click</span> to set homestay
              location.
            </p>
          </div>
        </div>

        {/* Attractions List */}
        <div className="mt-12">
          <h2 className="text-2xl font-semibold mb-4">Current Attractions</h2>

          {isLoading ? (
            <p>Loading attractions...</p>
          ) : attractions.length === 0 ? (
            <p>No attractions found.</p>
          ) : (
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Coordinates
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {attractions.map((item) => (
                    <tr key={item._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {item.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                        {item.description}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.coords.join(", ")}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => handleEdit(item)}
                          className="text-indigo-600 hover:text-indigo-900 mr-3"
                          disabled={isLoading}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(item._id!)}
                          className="text-red-600 hover:text-red-900"
                          disabled={isLoading}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminAttractionsPage;
