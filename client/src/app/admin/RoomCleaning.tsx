import { useState, useEffect } from "react";
import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import Sidebar from "@/components/layout/sidebar";
import { API_URL } from "@/constants/baseUrl";

// Types
interface CleaningRequest {
  _id: string;
  payment: {
    _id: string;
    transactionId: string;
    checkIn: string;
    checkOut: string;
  };
  room: {
    _id: string;
    name: string;
    roomNumber: string;
  };
  user: {
    _id: string;
    name: string;
    email: string;
  };
  scheduledDate: string;
  timeSlot: "morning" | "afternoon" | "evening";
  specialRequests?: string;
  status: "requested" | "confirmed" | "completed" | "cancelled";
  createdAt: string;
  completedAt?: string;
}

// Time slot mapping for display
const timeSlots = [
  { id: "morning", label: "Morning", time: "9:00 AM - 12:00 PM" },
  { id: "afternoon", label: "Afternoon", time: "1:00 PM - 4:00 PM" },
  { id: "evening", label: "Evening", time: "5:00 PM - 8:00 PM" },
];

export default function RoomCleaning() {
  const [isLoading, setIsLoading] = useState(true);
  const [cleaningRequests, setCleaningRequests] = useState<CleaningRequest[]>(
    []
  );
  const [filteredRequests, setFilteredRequests] = useState<CleaningRequest[]>(
    []
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [activeTab, setActiveTab] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFilter, setDateFilter] = useState<Date | null>(null);

  // Edit modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState<CleaningRequest | null>(
    null
  );
  const [editStatus, setEditStatus] =
    useState<CleaningRequest["status"]>("requested");

  useEffect(() => {
    const checkAdminAuth = () => {
      const token = localStorage.getItem("token");
      if (!token) return false;
      return true;
    };

    if (checkAdminAuth()) {
      fetchCleaningRequests();
    }
  }, [currentPage, activeTab]);

  useEffect(() => {
    applyFilters();
  }, [cleaningRequests, searchTerm, dateFilter, activeTab]);

  const fetchCleaningRequests = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      let url = `${API_URL}/api/cleaning/admin?page=${currentPage}&limit=10`;

      if (activeTab !== "all") {
        url += `&status=${activeTab}`;
      }

      const response = await fetch(url, {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch cleaning requests"
        );
      }

      const data = await response.json();
      setCleaningRequests(data.data);
      setTotalPages(data.pages);
    } catch (error) {
      console.error("Error fetching cleaning requests:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to fetch cleaning requests"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let result = [...cleaningRequests];

    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter((request) => {
        // Safely access all properties with optional chaining
        const userName = request.user?.name?.toLowerCase() || "";
        const userEmail = request.user?.email?.toLowerCase() || "";
        const roomName = request.room?.name?.toLowerCase() || "";
        const roomNumber = request.room?.roomNumber?.toLowerCase() || "";
        const transactionId =
          request.payment?.transactionId?.toLowerCase() || "";

        return (
          userName.includes(lowerSearchTerm) ||
          userEmail.includes(lowerSearchTerm) ||
          roomName.includes(lowerSearchTerm) ||
          roomNumber.includes(lowerSearchTerm) ||
          transactionId.includes(lowerSearchTerm)
        );
      });
    }

    if (dateFilter) {
      result = result.filter((request) => {
        if (!request.scheduledDate) return false;
        const selectedDate = new Date(dateFilter).toDateString();
        const requestDate = new Date(request.scheduledDate).toDateString();
        return requestDate === selectedDate;
      });
    }

    setFilteredRequests(result);
  };

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setCurrentPage(1);
  };

  const handleEditRequest = (request: CleaningRequest) => {
    setCurrentRequest(request);
    setEditStatus(request.status);
    setIsEditModalOpen(true);
  };

  const handleUpdateRequest = async () => {
    if (!currentRequest) return;

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_URL}/api/cleaning/admin/${currentRequest._id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status: editStatus }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to update cleaning request"
        );
      }

      setIsEditModalOpen(false);
      fetchCleaningRequests();
      alert("Cleaning request updated successfully!");
    } catch (error) {
      console.error("Error updating cleaning request:", error);
      alert(
        error instanceof Error
          ? error.message
          : "Failed to update cleaning request"
      );
    }
  };

  const getTimeSlotLabel = (slotId: string) => {
    const slot = timeSlots.find((slot) => slot.id === slotId);
    return slot ? `${slot.label} (${slot.time})` : slotId;
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "requested":
        return "bg-blue-100 text-blue-800";
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-gray-100 text-gray-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const EditModal = () => {
    if (!isEditModalOpen || !currentRequest) return null;

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg p-6 w-full max-w-md">
          <h2 className="text-xl font-bold mb-4">Edit Cleaning Request</h2>

          <div className="mb-4">
            <p>
              <span className="font-medium">Room:</span>{" "}
              {currentRequest.room?.name} (#{currentRequest.room?.roomNumber})
            </p>
            <p>
              <span className="font-medium">Guest:</span>{" "}
              {currentRequest.user?.name}
            </p>
            <p>
              <span className="font-medium">Date:</span>{" "}
              {formatDate(currentRequest.scheduledDate)}
            </p>
            <p>
              <span className="font-medium">Time:</span>{" "}
              {getTimeSlotLabel(currentRequest.timeSlot)}
            </p>
            {currentRequest.specialRequests && (
              <p>
                <span className="font-medium">Special Requests:</span>{" "}
                {currentRequest.specialRequests}
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={editStatus}
                onValueChange={(value) =>
                  setEditStatus(value as CleaningRequest["status"])
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 mt-6">
            <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateRequest}>Save Changes</Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <div className="ml-[338px] container mx-auto px-4 py-8 pt-16">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Room Cleaning Management</h1>
        </div>

        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search</Label>
                <Input
                  id="search"
                  placeholder="Search by guest, room, or transaction ID"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="w-full md:w-48">
                <Label htmlFor="date">Filter by Date</Label>
                <DatePicker
                  selected={dateFilter}
                  onChange={(date) => setDateFilter(date)}
                  dateFormat="MMMM d, yyyy"
                  isClearable
                  placeholderText="Select Date"
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm("");
                    setDateFilter(null);
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs value={activeTab} onValueChange={handleTabChange}>
          <div className="mb-4">
            <TabsList className="w-full grid grid-cols-5">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="requested">Requested</TabsTrigger>
              <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="mb-8">
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <p>Loading cleaning requests...</p>
              </div>
            ) : filteredRequests.length === 0 ? (
              <Card>
                <CardContent className="p-8 text-center">
                  <div className="flex flex-col items-center justify-center space-y-4">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">
                      No cleaning requests found
                    </h3>
                    <p className="text-gray-500">
                      {searchTerm || dateFilter
                        ? "No results match your search criteria. Try adjusting your filters."
                        : `No ${
                            activeTab !== "all" ? activeTab : ""
                          } cleaning requests available.`}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {filteredRequests.map((request) => (
                  <Card key={request._id} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                        <div className="md:col-span-8 p-4">
                          <div className="flex justify-between">
                            <div>
                              <h3 className="font-semibold text-lg">
                                Room: {request.room?.name} (#
                                {request.room?.roomNumber})
                              </h3>
                              <p className="text-gray-600">
                                Guest: {request.user?.name} (
                                {request.user?.email})
                              </p>
                            </div>
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadgeClass(
                                request.status
                              )}`}
                            >
                              {request.status?.charAt(0).toUpperCase() +
                                request.status?.slice(1)}
                            </span>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-3">
                            <div>
                              <span className="text-gray-500">
                                Scheduled Date:
                              </span>
                              <span className="ml-2 font-medium">
                                {formatDate(request.scheduledDate)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Time Slot:</span>
                              <span className="ml-2">
                                {getTimeSlotLabel(request.timeSlot)}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Created:</span>
                              <span className="ml-2">
                                {format(
                                  new Date(request.createdAt),
                                  "MMM d, yyyy h:mm a"
                                )}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">
                                Stay Period:
                              </span>
                              <span className="ml-2">
                                {format(
                                  new Date(request.payment?.checkIn),
                                  "MMM d"
                                )}{" "}
                                -{" "}
                                {format(
                                  new Date(request.payment?.checkOut),
                                  "MMM d, yyyy"
                                )}
                              </span>
                            </div>
                            {request.specialRequests && (
                              <div className="md:col-span-2">
                                <span className="text-gray-500">
                                  Special Requests:
                                </span>
                                <span className="ml-2">
                                  {request.specialRequests}
                                </span>
                              </div>
                            )}
                            {request.completedAt && (
                              <div>
                                <span className="text-gray-500">
                                  Completed:
                                </span>
                                <span className="ml-2">
                                  {format(
                                    new Date(request.completedAt),
                                    "MMM d, yyyy h:mm a"
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="md:col-span-4 p-4 bg-gray-50 md:bg-transparent flex flex-col justify-center border-t md:border-t-0 md:border-l">
                          <Button
                            onClick={() => handleEditRequest(request)}
                            className="mb-2 bg-[#DB5138] text-white hover:bg-[#DB5138]/90"
                          >
                            Update Status
                          </Button>

                          <div className="text-sm mt-2">
                            <p className="text-gray-500">
                              Transaction ID: {request.payment?.transactionId}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex justify-center mt-6">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                  >
                    Previous
                  </Button>
                  <span className="px-4 py-2 rounded border">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <EditModal />
      </div>
    </div>
  );
}
