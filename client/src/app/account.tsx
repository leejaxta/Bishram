import Navbar from "@/components/layout/navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import React, { useState, useEffect, useMemo } from "react";
import { getCurrentUser } from "@/utils/auth";
// Import date-fns for date formatting
import { format } from "date-fns";
// Import DatePicker
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { API_URL } from "@/constants/baseUrl";

export default function Account() {
  interface JwtPayload {
    exp?: number;
    isAdmin?: boolean;
    name?: string;
  }
  interface Booking {
    id: number;
    name: string;
    myImg: string[];
    price: number;
    adults: number;
    children: number;
    status: string;
    checkIn?: string;
    checkOut?: string;
    paymentMethod?: string;
    transactionId?: string;
    hasReviewed?: boolean;
  }

  interface Review {
    rating: number;
    comment: string;
  }

  interface CleaningRequest {
    _id: string;
    scheduledDate: string;
    timeSlot: "morning" | "afternoon" | "evening";
    specialRequests?: string;
    status: "requested" | "confirmed" | "completed" | "cancelled";
    createdAt: string;
  }

  const timeSlots = [
    { id: "morning", label: "Morning", time: "9:00 AM - 12:00 PM" },
    { id: "afternoon", label: "Afternoon", time: "1:00 PM - 4:00 PM" },
    { id: "evening", label: "Evening", time: "5:00 PM - 8:00 PM" },
  ];

  const [user, setUser] = useState({
    name: "",
    email: "",
    number: "",
  });
  const currentUser = useMemo(() => getCurrentUser(), []);
  console.log("currentUser", currentUser);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [selectedBooking, setSelectedBooking] = useState<Booking | null>(null);
  const [visibleBookings, setVisibleBookings] = useState(4);
  const [reviews, setReviews] = useState<Record<number, Review>>({});

  // Cleaning state
  const [cleaningRequests, setCleaningRequests] = useState<
    Record<number, CleaningRequest[]>
  >({});
  const [showCleaningForm, setShowCleaningForm] = useState<number | null>(null);
  const [cleaningDate, setCleaningDate] = useState<Date | null>(null);
  const [cleaningTimeSlot, setCleaningTimeSlot] = useState("");
  const [cleaningSpecialRequests, setCleaningSpecialRequests] = useState("");
  const [isSubmittingCleaning, setIsSubmittingCleaning] = useState(false);

  useEffect(() => {
    console.log("currentUser", currentUser);

    const fetchData = async () => {
      try {
        if (currentUser) {
          // Set user data from currentUser - only if it's different
          setUser({
            name: currentUser.name || "",
            email: currentUser.email || "",
            number: currentUser.number || "",
          });

          // Fetch booking history from existing endpoint
          const token = localStorage.getItem("token");
          if (!token) {
            throw new Error("No authentication token found");
          }

          const response = await fetch(
            `${API_URL}/api/users/booking/${currentUser.id}`,
            {
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
            }
          );

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(
              errorData.message || "Failed to fetch booking history"
            );
          }

          const { bookings } = await response.json();

          // Sort bookings: ongoing → upcoming → completed
          const sortedBookings = bookings.sort((a: Booking, b: Booking) => {
            if (a.status === "ongoing") return -1;
            if (b.status === "ongoing") return 1;
            if (a.status === "upcoming") return -1;
            if (b.status === "upcoming") return 1;
            return 0;
          });

          setBookings(sortedBookings);
          console.log("bookings", sortedBookings);

          // Fetch cleaning requests for ongoing bookings
          sortedBookings
            .filter(
              (booking: { status: string }) => booking.status === "ongoing"
            )
            .forEach((booking: { id: number }) => {
              fetchCleaningRequests(booking.id);
            });
        }
      } catch (error) {
        console.error("Error fetching booking history:", error);
      }
    };

    fetchData();
  }, [currentUser]); // Only run when currentUser changes

  let payload: JwtPayload | null = null;

  const isAdmin = ((): boolean => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
        const currentTime = Math.floor(Date.now() / 1000);
        if (payload.exp && payload.exp < currentTime) {
          console.warn("Token has expired");
          return false;
        }
        return payload.isAdmin === true;
      }
    } catch (error) {
      console.error("Error parsing JWT token:", error);
    }
    return false;
  })();

  // Function to fetch cleaning requests for a booking
  const fetchCleaningRequests = async (bookingId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_URL}/api/cleaning/payment/${bookingId}`,
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to fetch cleaning requests"
        );
      }

      const data = await response.json();

      setCleaningRequests((prev) => ({
        ...prev,
        [bookingId]: data.data,
      }));
    } catch (error) {
      console.error("Error fetching cleaning requests:", error);
    }
  };

  const loadMoreBookings = () => {
    setVisibleBookings((prev) => prev + 4);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setUser({ ...user, [name]: value });
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm({ ...passwordForm, [name]: value });
  };

  const handleReviewChange = (
    bookingId: number,
    field: keyof Review,
    value: string | number
  ) => {
    setReviews((prev) => ({
      ...prev,
      [bookingId]: {
        ...(prev[bookingId] || { rating: 0, comment: "" }),
        [field]: value,
      },
    }));
  };

  const handleReviewSubmit = async (bookingId: number) => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }
      console.log(bookingId);

      const review = reviews[bookingId];
      if (!review || !review.rating || !review.comment) {
        alert("Please provide both a rating and a comment");
        return;
      }

      const response = await fetch(`${API_URL}/api/users/review`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          bookingId,
          rating: review.rating,
          comment: review.comment,
          userId: currentUser?.id,
          name: currentUser?.name,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to submit review");
      }

      setBookings((prev) =>
        prev.map((booking) =>
          booking.id === bookingId ? { ...booking, hasReviewed: true } : booking
        )
      );

      alert("Review submitted successfully!");
    } catch (error) {
      console.error("Review submission error:", error);
      alert(error instanceof Error ? error.message : "Failed to submit review");
    }
  };

  const handleSaveChanges = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(`${API_URL}/api/users/${currentUser?.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(user),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to update user");
      }

      const data = await response.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
      }

      setIsEditing(false);
      alert("Profile updated successfully!");
      const updatedUser = getCurrentUser();
      setUser({ ...updatedUser, ...user });
    } catch (error: unknown) {
      console.error("Update error:", error);
      alert((error as Error).message || "Failed to update profile");
      setUser({ ...getCurrentUser(), ...user });
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // 1. Validate password match
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert("New passwords don't match!");
      return;
    }

    // 2. Get auth token
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login again");
      return;
    }

    try {
      // 3. Send request to backend
      const response = await fetch(
        `${API_URL}/api/users/password/${currentUser?.id}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to change password");
      }

      // 4. Success handling
      alert("Password changed successfully!");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Password change error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to change password"
      );
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/";
  };

  const toggleBookingDetails = (booking: Booking) => {
    setSelectedBooking(selectedBooking?.id === booking.id ? null : booking);

    // If opening an ongoing booking, fetch cleaning requests
    if (booking.status === "ongoing" && selectedBooking?.id !== booking.id) {
      fetchCleaningRequests(booking.id);
    }
  };

  // Cleaning feature functions
  const toggleCleaningForm = (bookingId: number) => {
    setShowCleaningForm(showCleaningForm === bookingId ? null : bookingId);
    // Reset form fields when toggling
    setCleaningDate(null);
    setCleaningTimeSlot("");
    setCleaningSpecialRequests("");
  };

  const handleCleaningSubmit = async (bookingId: number) => {
    // Form validation
    if (!cleaningDate || !cleaningTimeSlot) {
      alert("Please select both a date and time slot");
      return;
    }

    try {
      setIsSubmittingCleaning(true);
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      // Format date to string
      const formattedDate = cleaningDate.toISOString().split("T")[0];

      const response = await fetch(`${API_URL}/api/cleaning/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          paymentId: bookingId.toString(),
          scheduledDate: formattedDate,
          timeSlot: cleaningTimeSlot,
          specialRequests: cleaningSpecialRequests,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to schedule cleaning");
      }

      // Reset form
      setCleaningDate(null);
      setCleaningTimeSlot("");
      setCleaningSpecialRequests("");
      setShowCleaningForm(null);

      // Refetch cleaning requests to update UI
      await fetchCleaningRequests(bookingId);

      alert("Room cleaning scheduled successfully!");
    } catch (error) {
      console.error("Cleaning scheduling error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to schedule cleaning"
      );
    } finally {
      setIsSubmittingCleaning(false);
    }
  };

  const handleCancelCleaning = async (bookingId: number, requestId: string) => {
    if (!confirm("Are you sure you want to cancel this cleaning request?")) {
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No authentication token found");
      }

      const response = await fetch(
        `${API_URL}/api/cleaning/cancel/${requestId}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || "Failed to cancel cleaning request"
        );
      }

      // Refetch cleaning requests to update UI
      await fetchCleaningRequests(bookingId);

      alert("Cleaning request cancelled successfully!");
    } catch (error) {
      console.error("Cancellation error:", error);
      alert(
        error instanceof Error ? error.message : "Failed to cancel request"
      );
    }
  };

  // Helper functions for the cleaning feature
  const getTimeSlotLabel = (slotId: string) => {
    const slot = timeSlots.find((slot) => slot.id === slotId);
    return slot ? `${slot.label} (${slot.time})` : slotId;
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), "MMMM d, yyyy");
  };

  const getDateConstraints = (booking: Booking) => {
    if (!booking.checkIn || !booking.checkOut)
      return { minDate: new Date(), maxDate: new Date() };

    const checkIn = new Date(booking.checkIn);
    const checkOut = new Date(booking.checkOut);
    const today = new Date();

    // Min date is either today or check-in date, whichever is later
    const minDate = today > checkIn ? today : checkIn;

    return { minDate, maxDate: checkOut };
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <div className="container mx-auto px-4 py-8 pt-16">
        <h1 className="text-3xl font-bold mb-8">My Account</h1>

        {/* User Information Section */}
        <section className="mb-12">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-semibold">Personal Information</h2>
            {!isEditing ? (
              <Button variant="outline" onClick={() => setIsEditing(true)}>
                Edit Details
              </Button>
            ) : (
              <div className="space-x-2">
                <Button onClick={handleSaveChanges}>Save Changes</Button>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
              </div>
            )}
          </div>

          <Card>
            <CardContent className="p-6 grid md:grid-cols-2 gap-4">
              {isEditing ? (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Full Name
                    </label>
                    <Input
                      name="name"
                      value={user.name}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Email
                    </label>
                    <Input
                      name="email"
                      value={user.email}
                      onChange={handleInputChange}
                      type="email"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone Number
                    </label>
                    <Input
                      name="number"
                      value={user.number}
                      onChange={handleInputChange}
                      type="tel"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <p className="text-sm text-gray-500">Full Name</p>
                    <p className="font-medium">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{user.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium">{user.number}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </section>

        {/* My Bookings Section */}
        {!isAdmin && (
          <section className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">My Bookings</h2>
            {bookings.length === 0 ? (
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
                        d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                      />
                    </svg>
                    <h3 className="text-lg font-medium text-gray-900">
                      No bookings found
                    </h3>
                    <p className="text-gray-500">
                      You haven't made any bookings yet. Start exploring our
                      rooms!
                    </p>
                    <Button
                      variant="outline"
                      onClick={() => (window.location.href = "/rooms")}
                    >
                      Browse Rooms
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <>
                <div className="grid md:grid-cols-2 gap-4">
                  {bookings.slice(0, visibleBookings).map((booking) => (
                    <Card
                      key={booking.id}
                      className={`relative ${
                        booking.status === "ongoing"
                          ? "border-2 border-green-500"
                          : ""
                      }`}
                    >
                      <CardHeader className="p-0 relative">
                        <img
                          src={booking.myImg[0]}
                          alt={booking.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                        />
                        {booking.status === "ongoing" && (
                          <div className="absolute top-2 left-2 bg-green-500 text-white px-2 py-1 rounded-md text-xs font-bold">
                            CURRENT STAY
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-semibold">{booking.name}</h3>
                            <span
                              className={`inline-block px-2 py-1 text-xs rounded-full mt-1 ${
                                booking.status === "upcoming"
                                  ? "bg-blue-100 text-blue-800"
                                  : booking.status === "completed"
                                  ? "bg-gray-100 text-gray-800"
                                  : "bg-green-100 text-green-800"
                              }`}
                            >
                              {booking.status.charAt(0).toUpperCase() +
                                booking.status.slice(1)}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleBookingDetails(booking)}
                          >
                            {selectedBooking?.id === booking.id
                              ? "Hide Details"
                              : "View Details"}
                          </Button>
                        </div>

                        {selectedBooking?.id === booking.id && (
                          <div className="mt-4 space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Check-in:</span>
                              <span>{booking.checkIn}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Check-out:</span>
                              <span>{booking.checkOut}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Guests:</span>
                              <span>
                                {booking.adults} adult, {booking.children}{" "}
                                children
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Payment Method:
                              </span>
                              <span>{booking.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">
                                Transaction ID:
                              </span>
                              <span>{booking.transactionId}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Amount:</span>
                              <span className="font-medium">
                                Rs.{booking.price}
                              </span>
                            </div>

                            {/* Room Cleaning Section */}
                            {booking.status === "ongoing" && (
                              <div className="pt-4 border-t mt-4">
                                <h4 className="font-medium mb-2">
                                  Room Cleaning Service
                                </h4>

                                {/* Display existing cleaning requests */}
                                {cleaningRequests[booking.id] &&
                                cleaningRequests[booking.id].length > 0 ? (
                                  <div className="mb-4">
                                    <h5 className="text-sm font-medium mb-2">
                                      Your Cleaning Requests:
                                    </h5>
                                    <div className="space-y-3">
                                      {cleaningRequests[booking.id].map(
                                        (request) => (
                                          <div
                                            key={request._id}
                                            className={`p-3 rounded-md text-sm ${
                                              request.status === "requested"
                                                ? "bg-blue-50 border border-blue-200"
                                                : request.status === "confirmed"
                                                ? "bg-green-50 border border-green-200"
                                                : request.status === "completed"
                                                ? "bg-gray-50 border border-gray-200"
                                                : "bg-red-50 border border-red-200"
                                            }`}
                                          >
                                            <div className="flex justify-between">
                                              <span className="font-medium">
                                                {formatDate(
                                                  request.scheduledDate
                                                )}
                                              </span>
                                              <span
                                                className={`px-2 py-0.5 rounded-full text-xs ${
                                                  request.status === "requested"
                                                    ? "bg-blue-100 text-blue-800"
                                                    : request.status ===
                                                      "confirmed"
                                                    ? "bg-green-100 text-green-800"
                                                    : request.status ===
                                                      "completed"
                                                    ? "bg-gray-100 text-gray-700"
                                                    : "bg-red-100 text-red-800"
                                                }`}
                                              >
                                                {request.status
                                                  .charAt(0)
                                                  .toUpperCase() +
                                                  request.status.slice(1)}
                                              </span>
                                            </div>
                                            <div className="mt-1">
                                              <span className="text-gray-600">
                                                Time:{" "}
                                              </span>
                                              <span>
                                                {getTimeSlotLabel(
                                                  request.timeSlot
                                                )}
                                              </span>
                                            </div>
                                            {request.specialRequests && (
                                              <div className="mt-1">
                                                <span className="text-gray-600">
                                                  Special requests:{" "}
                                                </span>
                                                <span>
                                                  {request.specialRequests}
                                                </span>
                                              </div>
                                            )}
                                            {request.status === "requested" && (
                                              <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() =>
                                                  handleCancelCleaning(
                                                    booking.id,
                                                    request._id
                                                  )
                                                }
                                                className="mt-2 text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 w-full"
                                              >
                                                Cancel Request
                                              </Button>
                                            )}
                                          </div>
                                        )
                                      )}
                                    </div>
                                  </div>
                                ) : null}

                                {/* Schedule New Cleaning Button */}
                                {showCleaningForm === booking.id ? (
                                  <div className="space-y-3 p-3 border rounded-md bg-gray-50">
                                    <h5 className="font-medium">
                                      Schedule Room Cleaning
                                    </h5>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">
                                        Select Date
                                      </label>
                                      <DatePicker
                                        selected={cleaningDate}
                                        onChange={(date: Date | null) =>
                                          date !== null && setCleaningDate(date)
                                        }
                                        dateFormat="MMMM d, yyyy"
                                        minDate={
                                          getDateConstraints(booking).minDate
                                        }
                                        maxDate={
                                          getDateConstraints(booking).maxDate
                                        }
                                        className="w-full p-2 border rounded"
                                        placeholderText="Select a date"
                                      />
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">
                                        Select Time Slot
                                      </label>
                                      <select
                                        value={cleaningTimeSlot}
                                        onChange={(e) =>
                                          setCleaningTimeSlot(e.target.value)
                                        }
                                        className="w-full p-2 border rounded"
                                      >
                                        <option value="">
                                          Select time slot
                                        </option>
                                        {timeSlots.map((slot) => (
                                          <option key={slot.id} value={slot.id}>
                                            {slot.label} ({slot.time})
                                          </option>
                                        ))}
                                      </select>
                                    </div>

                                    <div>
                                      <label className="block text-sm font-medium mb-1">
                                        Special Requests (optional)
                                      </label>
                                      <textarea
                                        value={cleaningSpecialRequests}
                                        onChange={(e) =>
                                          setCleaningSpecialRequests(
                                            e.target.value
                                          )
                                        }
                                        className="w-full p-2 border rounded"
                                        rows={2}
                                        placeholder="Any special cleaning instructions?"
                                      />
                                    </div>

                                    <div className="flex space-x-2 pt-2">
                                      <Button
                                        onClick={() =>
                                          handleCleaningSubmit(booking.id)
                                        }
                                        className="flex-1"
                                        disabled={isSubmittingCleaning}
                                      >
                                        {isSubmittingCleaning
                                          ? "Scheduling..."
                                          : "Schedule Cleaning"}
                                      </Button>
                                      <Button
                                        variant="outline"
                                        onClick={() =>
                                          toggleCleaningForm(booking.id)
                                        }
                                        className="flex-1"
                                      >
                                        Cancel
                                      </Button>
                                    </div>
                                  </div>
                                ) : (
                                  <Button
                                    onClick={() =>
                                      toggleCleaningForm(booking.id)
                                    }
                                    className="w-full bg-green-600 hover:bg-green-700"
                                  >
                                    Schedule Room Cleaning
                                  </Button>
                                )}
                              </div>
                            )}

                            {booking.status === "completed" && (
                              <div className="pt-4 border-t mt-4">
                                {booking.hasReviewed ? (
                                  <div className="text-center text-green-600">
                                    <p>Thank you for your review!</p>
                                  </div>
                                ) : (
                                  <>
                                    <h4 className="font-medium mb-2">
                                      Leave a Review
                                    </h4>
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium mb-1">
                                        Rating (1-5)
                                      </label>
                                      <select
                                        value={reviews[booking.id]?.rating || 0}
                                        onChange={(e) =>
                                          handleReviewChange(
                                            booking.id,
                                            "rating",
                                            parseInt(e.target.value)
                                          )
                                        }
                                        className="w-full p-2 border rounded"
                                        required
                                      >
                                        <option value="0">Select rating</option>
                                        <option value="1">1 - Poor</option>
                                        <option value="2">2 - Fair</option>
                                        <option value="3">3 - Good</option>
                                        <option value="4">4 - Very Good</option>
                                        <option value="5">5 - Excellent</option>
                                      </select>
                                    </div>
                                    <div className="mb-3">
                                      <label className="block text-sm font-medium mb-1">
                                        Your Review
                                      </label>
                                      <textarea
                                        value={
                                          reviews[booking.id]?.comment || ""
                                        }
                                        onChange={(e) =>
                                          handleReviewChange(
                                            booking.id,
                                            "comment",
                                            e.target.value
                                          )
                                        }
                                        className="w-full p-2 border rounded"
                                        rows={3}
                                        required
                                      />
                                    </div>
                                    <Button
                                      onClick={() =>
                                        handleReviewSubmit(booking.id)
                                      }
                                      className="w-full bg-blue-600 hover:bg-blue-700"
                                    >
                                      Submit Review
                                    </Button>
                                  </>
                                )}
                              </div>
                            )}
                            {/* {booking.status === "completed" &&
                            submittedReviews[booking.id] && (
                              <div className="pt-4 border-t mt-4 text-center text-green-600">
                                <p>Thank you for your review!</p>
                              </div>
                            )} */}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {bookings.length > visibleBookings && (
                  <div className="mt-6 text-center">
                    <Button
                      variant="outline"
                      onClick={loadMoreBookings}
                      className="mx-auto"
                    >
                      Load More Bookings
                    </Button>
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* Security Settings Section */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold mb-4">Security Settings</h2>

          <Card>
            <CardContent className="p-6">
              <form onSubmit={handlePasswordSubmit}>
                <h3 className="font-medium mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Current Password
                    </label>
                    <Input
                      name="currentPassword"
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <Input
                      name="newPassword"
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm New Password
                    </label>
                    <Input
                      name="confirmPassword"
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      required
                    />
                  </div>
                  <Button type="submit">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </section>

        <div className="flex justify-end">
          <Button variant="destructive" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </div>
    </div>
  );
}
