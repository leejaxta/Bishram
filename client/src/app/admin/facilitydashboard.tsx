import { useState, useEffect } from "react";
import { API_URL } from "@/constants/baseUrl";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Edit, X } from "lucide-react";

interface Facility {
  _id: string;
  name: string;
  myImg: string;
  public_id?: string;
}

export default function FacilityDashboard() {
  const [facilities, setFacilities] = useState<Facility[]>([]);
  const [newFacility, setNewFacility] = useState<{
    name: string;
    myImg: File | null;
  }>({ name: "", myImg: null });
  const [editingFacility, setEditingFacility] = useState<Facility | null>(null);
  const [loading, setLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  // Fetch Facilities
  const fetchFacilities = async () => {
    try {
      const response = await fetch(`${API_URL}/api/facilities`);
      if (!response.ok) throw new Error("Failed to fetch facilities");
      const data = await response.json();
      setFacilities(data);
    } catch (error) {
      console.error(error);
      alert("Error fetching facilities");
    }
  };

  useEffect(() => {
    fetchFacilities();
  }, []);

  // Add Facility
  const handleAddFacility = async () => {
    if (!newFacility.name || !newFacility.myImg) {
      alert("Please provide name and image.");
      return;
    }
    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("name", newFacility.name);
      formData.append("myImg", newFacility.myImg);

      const response = await fetch(`${API_URL}/api/facilities`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) throw new Error("Failed to upload facility");

      alert("Facility added successfully!");
      setNewFacility({ name: "", myImg: null });
      setShowAddForm(false);
      fetchFacilities();
    } catch (error) {
      console.error(error);
      alert("Failed to add facility");
    } finally {
      setLoading(false);
    }
  };

  // Update Facility
  const handleUpdateFacility = async () => {
    if (!editingFacility || !editingFacility._id) return;
    if (!editingFacility.name) {
      alert("Please provide a name.");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const formData = new FormData();
      formData.append("name", editingFacility.name);
      if (newFacility.myImg) {
        formData.append("myImg", newFacility.myImg);
      }

      const response = await fetch(
        `${API_URL}/api/facilities/${editingFacility._id}`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        }
      );

      if (!response.ok) throw new Error("Failed to update facility");

      alert("Facility updated successfully!");
      setEditingFacility(null);
      setNewFacility({ name: "", myImg: null });
      fetchFacilities();
    } catch (error) {
      console.error(error);
      alert("Failed to update facility");
    } finally {
      setLoading(false);
    }
  };

  // Delete Facility
  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this facility?"))
      return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/facilities/${id}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete facility");

      alert("Facility deleted successfully!");
      fetchFacilities();
    } catch (error) {
      console.error(error);
      alert("Failed to delete facility");
    }
  };

  // Start editing a facility
  const startEditing = (facility: Facility) => {
    setEditingFacility(facility);
    setNewFacility({ name: facility.name, myImg: null });
    setShowAddForm(false);
  };

  // Cancel editing

  const handleCancel = () => {
    setEditingFacility(null);
    setNewFacility({ name: "", myImg: null });
    setShowAddForm(false);
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1">
        <Navbar />

        <main
          className="ml-[338px] mt-4 container mx-auto p-6"
          style={{ maxWidth: `calc(100vw - 438px)` }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Manage Facilities</h1>
            {!showAddForm && !editingFacility && (
              <Button
                className="bg-[#DB5138] hover:bg-[#DB5138]/90 text-white "
                onClick={() => setShowAddForm(true)}
              >
                <Plus className="mr-2" /> Add Facility
              </Button>
            )}
          </div>

          {(showAddForm || editingFacility) && (
            <Card className="mb-6">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>
                    {editingFacility ? "Edit Facility" : "Add New Facility"}
                  </CardTitle>
                  <Button variant="ghost" size="icon" onClick={handleCancel}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Facility Name
                    </label>
                    <input
                      type="text"
                      placeholder="Enter facility name"
                      value={
                        editingFacility
                          ? editingFacility.name
                          : newFacility.name
                      }
                      onChange={(e) => {
                        if (editingFacility) {
                          setEditingFacility({
                            ...editingFacility,
                            name: e.target.value,
                          });
                        } else {
                          setNewFacility((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }));
                        }
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Facility Image
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setNewFacility((prev) => ({ ...prev, myImg: file }));
                      }}
                      className="w-full p-2 border rounded-md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button
                      className="bg-[#DB5138] hover:bg-[#DB5138]/90 text-white "
                      onClick={
                        editingFacility
                          ? handleUpdateFacility
                          : handleAddFacility
                      }
                      disabled={loading}
                    >
                      {loading
                        ? "Processing..."
                        : editingFacility
                        ? "Update Facility"
                        : "Add Facility"}
                    </Button>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {facilities.map((facility) => (
              <Card key={facility._id} className="relative">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    {facility.name.toUpperCase()}
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEditing(facility)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(facility._id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {facility.myImg ? (
                    <img
                      src={facility.myImg}
                      alt={facility.name}
                      className="w-full h-48 object-cover rounded-md mb-4"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md mb-4">
                      No Image Available
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
