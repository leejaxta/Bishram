import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { API_URL } from "@/constants/baseUrl";
import { Trash2, Plus, Edit, X } from "lucide-react";
import React, { useState, useEffect } from "react";

interface Room {
  _id: string;
  name: string;
  price: number;
  accommodation: {
    Adults: string;
    Kids: string;
    Room: string;
  };
  basic_amenities: string[];
  room_specific_amenities: string[];
  myImg: string[];
}

export default function RoomDashboard() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    price: 0,
    adultsCount: "",
    kidsCount: "",
    roomCount: "",
  });

  // Modified to use arrays for amenities
  const [basicAmenities, setBasicAmenities] = useState<string[]>([]);
  const [roomAmenities, setRoomAmenities] = useState<string[]>([]);
  const [newBasicAmenity, setNewBasicAmenity] = useState("");
  const [newRoomAmenity, setNewRoomAmenity] = useState("");

  const [images, setImages] = useState<File[]>([]);
  const [previewImages, setPreviewImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | null>(null);

  useEffect(() => {
    fetchRooms();
  }, []);

  const fetchRooms = async () => {
    try {
      const response = await fetch(`${API_URL}/api/rooms`);
      if (!response.ok) throw new Error("Failed to fetch rooms");
      const data = await response.json();
      setRooms(data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      alert("Failed to fetch rooms");
    }
  };

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const selectedFiles = Array.from(event.target.files).slice(0, 3);
      setImages(selectedFiles);
      const previews = selectedFiles.map((file) => URL.createObjectURL(file));
      setPreviewImages(previews);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      price: 0,
      adultsCount: "",
      kidsCount: "",
      roomCount: "",
    });
    setBasicAmenities([]);
    setRoomAmenities([]);
    setNewBasicAmenity("");
    setNewRoomAmenity("");
    setImages([]);
    setPreviewImages([]);
    setEditingRoom(null);
  };

  // Add a basic amenity
  const addBasicAmenity = () => {
    if (newBasicAmenity.trim()) {
      setBasicAmenities([...basicAmenities, newBasicAmenity.trim()]);
      setNewBasicAmenity("");
    }
  };

  // Add a room amenity
  const addRoomAmenity = () => {
    if (newRoomAmenity.trim()) {
      setRoomAmenities([...roomAmenities, newRoomAmenity.trim()]);
      setNewRoomAmenity("");
    }
  };

  // Remove amenities
  const removeBasicAmenity = (index: number) => {
    setBasicAmenities(basicAmenities.filter((_, i) => i !== index));
  };

  const removeRoomAmenity = (index: number) => {
    setRoomAmenities(roomAmenities.filter((_, i) => i !== index));
  };

  const prepareFormData = () => {
    // Prepare accommodation data
    const accommodationData = {
      Adults: formData.adultsCount,
      Kids: formData.kidsCount,
      Room: formData.roomCount,
    };

    // Create FormData
    const formDataObj = new FormData();
    formDataObj.append("name", formData.name);
    formDataObj.append("price", formData.price.toString());
    formDataObj.append("accommodation", JSON.stringify(accommodationData));
    formDataObj.append("basic_amenities", JSON.stringify(basicAmenities));
    formDataObj.append(
      "room_specific_amenities",
      JSON.stringify(roomAmenities)
    );

    // Append images with the correct field name 'myImg'
    images.forEach((image) => {
      formDataObj.append("myImg", image);
    });

    // If editing and no new images, ensure backend knows to keep existing ones
    if (editingRoom && images.length === 0) {
      formDataObj.append("keepExistingImages", "true");
    }

    return formDataObj;
  };

  const handleSubmit = async () => {
    setLoading(true);
    const formData = prepareFormData();
    const url = editingRoom
      ? `${API_URL}/api/rooms/${editingRoom._id}`
      : `${API_URL}/api/rooms`;
    const method = editingRoom ? "PUT" : "POST";

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "Request failed");
      }

      alert(`Room ${editingRoom ? "updated" : "added"} successfully!`);
      fetchRooms();
      setShowForm(false);
      resetForm();
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error:", error);
        alert(
          `Failed to ${editingRoom ? "update" : "add"} room. ${error.message}`
        );
      } else {
        console.error("Unknown error:", error);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!window.confirm("Are you sure you want to delete this room?")) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) return;

      const response = await fetch(`${API_URL}/api/rooms/${roomId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error("Failed to delete room");

      alert("Room deleted successfully!");
      fetchRooms();
    } catch (error) {
      console.error(error);
      alert("Failed to delete room");
    }
  };

  const startEditing = (room: Room) => {
    setEditingRoom(room);
    setFormData({
      name: room.name,
      price: room.price,
      adultsCount: room.accommodation.Adults,
      kidsCount: room.accommodation.Kids,
      roomCount: room.accommodation.Room,
    });

    // Set amenities arrays directly
    setBasicAmenities(room.basic_amenities || []);
    setRoomAmenities(room.room_specific_amenities || []);

    setPreviewImages(room.myImg || []);
    setShowForm(true);
  };

  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 p-6 overflow-y-auto">
        <Navbar />
        <div
          className="ml-[338px] mt-4  container mx-auto"
          style={{ maxWidth: `calc(100vw - 438px)` }}
        >
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-semibold">Room Management</h1>
            <Button
              onClick={() => {
                setShowForm(true);
                resetForm();
              }}
              className="flex bg-[#DB5138] hover:bg-[#DB5138]/90 text-white  items-center"
            >
              <Plus className="mr-2" /> Add Room
            </Button>
          </div>

          {showForm && (
            <div className="mb-6 p-6 border rounded-lg shadow-sm bg-white">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold">
                  {editingRoom ? "Edit Room" : "Add New Room"}
                </h2>
                <button
                  onClick={() => {
                    setShowForm(false);
                    resetForm();
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block font-medium mb-1">Room Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="Deluxe Room"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Price (Nepali Rs)
                  </label>
                  <input
                    type="number"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full p-2 border rounded"
                    placeholder="5000"
                  />
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Accommodation
                  </label>
                  <div className="space-y-3">
                    <div>
                      <label className="block mb-1">Adults</label>
                      <input
                        type="number"
                        value={formData.adultsCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            adultsCount: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="2"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Kids</label>
                      <input
                        type="number"
                        value={formData.kidsCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            kidsCount: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="1"
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Room</label>
                      <input
                        type="number"
                        value={formData.roomCount}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            roomCount: e.target.value,
                          })
                        }
                        className="w-full p-2 border rounded"
                        placeholder="1"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Basic Amenities
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {basicAmenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-blue-50 border border-blue-200 rounded-full px-3 py-1"
                      >
                        <span className="mr-1">{amenity}</span>
                        <button
                          onClick={() => removeBasicAmenity(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newBasicAmenity}
                      onChange={(e) => setNewBasicAmenity(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="WiFi, AC, TV..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addBasicAmenity();
                        }
                      }}
                    />
                    <button
                      onClick={addBasicAmenity}
                      className="px-4 py-2 bg-[#DB5138] hover:bg-[#DB5138]/90 text-white  rounded-md "
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Room Specific Amenities
                  </label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {roomAmenities.map((amenity, index) => (
                      <div
                        key={index}
                        className="flex items-center bg-green-50 border border-green-200 rounded-full px-3 py-1"
                      >
                        <span className="mr-1">{amenity}</span>
                        <button
                          onClick={() => removeRoomAmenity(index)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newRoomAmenity}
                      onChange={(e) => setNewRoomAmenity(e.target.value)}
                      className="flex-1 p-2 border rounded"
                      placeholder="Mini bar, Balcony, Ocean view..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          addRoomAmenity();
                        }
                      }}
                    />
                    <button
                      onClick={addRoomAmenity}
                      className="px-4 py-2 bg-[#DB5138] hover:bg-[#DB5138]/90 text-white  rounded-md "
                      type="button"
                    >
                      Add
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block font-medium mb-1">
                    Upload Images (Max 3){" "}
                    {editingRoom && "(Leave empty to keep current images)"}
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="w-full p-2 border rounded"
                  />
                </div>

                {previewImages.length > 0 && (
                  <div className="flex space-x-2 mt-2">
                    {previewImages.map((src, index) => (
                      <img
                        key={index}
                        src={src}
                        alt={`Preview ${index + 1}`}
                        className="w-24 h-24 object-cover rounded-md border"
                      />
                    ))}
                  </div>
                )}

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowForm(false);
                      resetForm();
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={loading}
                    className="px-4 py-2 bg-[#DB5138] hover:bg-[#DB5138]/90 text-white  rounded-md "
                  >
                    {loading
                      ? editingRoom
                        ? "Updating..."
                        : "Adding..."
                      : editingRoom
                      ? "Update Room"
                      : "Add Room"}
                  </button>
                </div>
              </div>
            </div>
          )}

          {rooms.length === 0 ? (
            <div className="text-center text-gray-500 mt-10">
              No rooms available. Add a new room to get started.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
                <Card key={room._id} className="relative">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      {room.name.toUpperCase()}
                      <div className="flex gap-2">
                        <button
                          onClick={() => startEditing(room)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <Edit size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(room._id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {room.myImg && room.myImg.length > 0 ? (
                      <img
                        src={room.myImg[0]}
                        alt={room.name}
                        className="w-full h-48 object-cover rounded-md mb-4"
                      />
                    ) : (
                      <div className="w-full h-48 bg-gray-200 flex items-center justify-center rounded-md mb-4">
                        No Image
                      </div>
                    )}
                    <div className="space-y-2">
                      <p>
                        <strong>Price:</strong> NPR {room.price}
                      </p>
                      <p>
                        <strong>Accommodation:</strong>
                      </p>
                      <ul className="list-disc list-inside">
                        <li>Adults: {room.accommodation.Adults}</li>
                        <li>Kids: {room.accommodation.Kids}</li>
                        <li>Rooms: {room.accommodation.Room}</li>
                      </ul>
                      {room.basic_amenities &&
                        room.basic_amenities.length > 0 && (
                          <div>
                            <strong>Basic Amenities:</strong>
                            <ul className="list-disc list-inside">
                              {room.basic_amenities.map((amenity, i) => (
                                <li key={i}>{amenity}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      {room.room_specific_amenities &&
                        room.room_specific_amenities.length > 0 && (
                          <div>
                            <strong>Room Specific Amenities:</strong>
                            <ul className="list-disc list-inside">
                              {room.room_specific_amenities.map(
                                (amenity, i) => (
                                  <li key={i}>{amenity}</li>
                                )
                              )}
                            </ul>
                          </div>
                        )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
