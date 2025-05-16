import React, { useEffect, useRef, useState } from "react";
import { Chart, ChartTypeRegistry } from "chart.js/auto";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FiCalendar, FiFilter, FiX } from "react-icons/fi";
import { API_URL } from "@/constants/baseUrl";

interface Payment {
  _id: string;
  createdAt: string;
  userName: string;
  userEmail: string;
  userAddress: string;
  userNumber: string;
  roomName: string;
  transaction_uuid: string;
  transactionId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  paymentMethod: string;
  status: string;
  totalAmount: number;
}

export default function BookingGraph() {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstance = useRef<Chart<
    keyof ChartTypeRegistry,
    number[],
    string
  > | null>(null);
  const [allBookings, setAllBookings] = useState<Payment[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<Payment[]>([]);
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState({
    from: "",
    to: "",
  });
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No authentication token found");

        const response = await fetch(`${API_URL}/api/payments`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(
            errorData.message || "Failed to fetch payment history"
          );
        }

        const data = await response.json();
        setAllBookings(data);
        setFilteredBookings(data);
      } catch (error) {
        console.error("Error fetching payment data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = allBookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt);
      const fromDate = dateRange.from ? new Date(dateRange.from) : null;
      const toDate = dateRange.to ? new Date(dateRange.to) : null;

      if (fromDate && bookingDate < fromDate) return false;
      if (toDate && bookingDate > new Date(toDate.setHours(23, 59, 59, 999)))
        return false;

      return true;
    });

    setFilteredBookings(filtered);
  }, [dateRange, allBookings]);

  useEffect(() => {
    if (filteredBookings.length === 0) return;

    const dailyCounts = filteredBookings.reduce(
      (acc: Record<string, number>, booking) => {
        const date = booking.createdAt.split("T")[0];
        acc[date] = (acc[date] || 0) + 1;
        return acc;
      },
      {}
    );

    const labels = Object.keys(dailyCounts).map((date) =>
      new Date(date).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      })
    );
    const data = Object.values(dailyCounts);

    if (chartRef.current) {
      const ctx = chartRef.current.getContext("2d");
      if (!ctx) return;

      if (chartInstance.current) {
        chartInstance.current.destroy();
      }

      chartInstance.current = new Chart(ctx, {
        type: "bar",
        data: {
          labels,
          datasets: [
            {
              label: "Daily Bookings",
              data,
              backgroundColor: "#DB5138",
              borderColor: "#c1452e",
              borderWidth: 1,
              borderRadius: 4,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: "top",
              labels: {
                font: {
                  size: 14,
                },
              },
            },
            tooltip: {
              backgroundColor: "#1F2937",
              titleFont: {
                size: 14,
              },
              bodyFont: {
                size: 12,
              },
            },
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: "Number of Bookings",
                font: {
                  size: 14,
                },
              },
              grid: {
                color: "#E5E7EB",
              },
            },
            x: {
              title: {
                display: true,
                text: "Date",
                font: {
                  size: 14,
                },
              },
              grid: {
                color: "#E5E7EB",
              },
            },
          },
        },
      });
    }

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [filteredBookings]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const resetFilters = () => {
    setDateRange({
      from: "",
      to: "",
    });
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1">
        <Navbar />
        <div className="ml-[338px] p-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header Section */}
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h1 className="text-2xl font-semibold text-gray-800">
                Bookings Analytics
              </h1>
              <Button
                variant="outline"
                className="flex items-center gap-2 text-[#DB5138] border-[#DB5138] hover:bg-[#FFF0ED]"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
              >
                <FiFilter size={16} />
                {isFilterOpen ? "Hide Filters" : "Show Filters"}
              </Button>
            </div>

            {/* Filter Section */}
            {isFilterOpen && (
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <div className="flex items-end gap-4">
                  <div className="flex-1">
                    <Label htmlFor="from" className="text-gray-600">
                      From Date
                    </Label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        id="from"
                        name="from"
                        value={dateRange.from}
                        onChange={handleDateChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="to" className="text-gray-600">
                      To Date
                    </Label>
                    <div className="relative mt-1">
                      <FiCalendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                      <Input
                        type="date"
                        id="to"
                        name="to"
                        value={dateRange.to}
                        onChange={handleDateChange}
                        className="pl-10"
                        min={dateRange.from}
                      />
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    onClick={resetFilters}
                    className="flex items-center gap-2 text-gray-600 hover:text-[#DB5138]"
                  >
                    <FiX size={16} />
                    Reset
                  </Button>
                </div>
              </div>
            )}

            {/* Chart Section */}
            <div className="p-6">
              <div className="mb-6">
                <div
                  className="w-full"
                  style={{ height: "400px", position: "relative" }}
                >
                  <canvas
                    ref={chartRef}
                    style={{
                      width: "100%",
                      height: "100%",
                      display: "block",
                    }}
                  />
                </div>
              </div>

              {/* Bookings Table Section */}
              <div className="mt-8">
                <div className="mb-4 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-800">
                    Booking Details
                  </h2>
                  <div className="text-sm text-gray-600">
                    Showing {filteredBookings.length} of {allBookings.length}{" "}
                    bookings
                    {(dateRange.from || dateRange.to) && (
                      <span className="ml-2">
                        (Filtered:{" "}
                        {new Date(dateRange.from).toLocaleDateString()} to{" "}
                        {new Date(dateRange.to).toLocaleDateString()})
                      </span>
                    )}
                  </div>
                </div>

                {filteredBookings.length === 0 ? (
                  <div className="bg-gray-50 rounded-lg p-8 text-center">
                    <p className="text-gray-500">
                      {allBookings.length === 0
                        ? "Loading booking data..."
                        : "No bookings found for selected date range"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden border border-gray-200 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Date
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            User
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Room
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Amount
                          </th>
                          <th
                            scope="col"
                            className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider"
                          >
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {filteredBookings.map((booking) => (
                          <React.Fragment key={booking._id}>
                            <tr className="hover:bg-gray-50">
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {new Date(
                                  booking.createdAt
                                ).toLocaleDateString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                <div className="font-medium">
                                  {booking.userName}
                                </div>
                                <div className="text-gray-500">
                                  {booking.userEmail}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {booking.roomName}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                Rs. {booking.totalAmount.toLocaleString()}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                <Button
                                  variant="outline"
                                  className={`${
                                    expandedRow === booking._id
                                      ? "bg-[#DB5138] text-white"
                                      : "text-[#DB5138] border-[#DB5138]"
                                  } hover:bg-[#DB5138] hover:text-white`}
                                  onClick={() =>
                                    setExpandedRow(
                                      expandedRow === booking._id
                                        ? null
                                        : booking._id
                                    )
                                  }
                                >
                                  {expandedRow === booking._id
                                    ? "Hide Details"
                                    : "View Details"}
                                </Button>
                              </td>
                            </tr>
                            {expandedRow === booking._id && (
                              <tr>
                                <td
                                  colSpan={5}
                                  className="px-6 py-4 bg-gray-50"
                                >
                                  <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                                    <div>
                                      <p className="font-medium">
                                        Transaction Details
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          ID:
                                        </span>{" "}
                                        {booking.transactionId}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          UUID:
                                        </span>{" "}
                                        {booking.transaction_uuid}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Method:
                                        </span>{" "}
                                        {booking.paymentMethod}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Status:
                                        </span>{" "}
                                        {booking.status}
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Stay Details
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Check-in:
                                        </span>{" "}
                                        {new Date(
                                          booking.checkIn
                                        ).toLocaleDateString()}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Check-out:
                                        </span>{" "}
                                        {new Date(
                                          booking.checkOut
                                        ).toLocaleDateString()}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Guests:
                                        </span>{" "}
                                        {booking.adults} adults,{" "}
                                        {booking.children} children
                                      </p>
                                    </div>
                                    <div>
                                      <p className="font-medium">
                                        Contact Information
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Phone:
                                        </span>{" "}
                                        {booking.userNumber}
                                      </p>
                                      <p>
                                        <span className="text-gray-500">
                                          Address:
                                        </span>{" "}
                                        {booking.userAddress}
                                      </p>
                                    </div>
                                  </div>
                                </td>
                              </tr>
                            )}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
