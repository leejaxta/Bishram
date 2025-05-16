import Navbar from "@/components/layout/navbar";
import React from "react";
import { API_URL } from "@/constants/baseUrl";
import { useState, useEffect } from "react";
import { Calendar } from "@/components/ui/calendar";
import { LuCalendarDays } from "react-icons/lu";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { AiFillCheckCircle } from "react-icons/ai";
import { FaPeopleRoof } from "react-icons/fa6";
import { MdOutlinePlaylistAddCheck } from "react-icons/md";
import { FaList } from "react-icons/fa";
import { AiFillStar } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { GiSupersonicBullet } from "react-icons/gi";
import { useNavigate, useParams } from "react-router-dom";
// import CryptoJS from "crypto-js";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Footer from "@/components/layout/footer";

export default function Roomdetails() {
  interface Room {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    room: any;
    price: number;
    _id: string; // Use _id instead of id
    name: string;
    myImg: Array<string>;
    basic_amenities: string[];
    room_specific_amenities: string[];
    accommodation: {
      Adults: number;
      Kids: number;
      Room: number;
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviews: any[];
    booked_date: Date[];
  }
  const [checkInDate, setCheckInDate] = React.useState<Date | undefined>();
  const [checkOutDate, setCheckOutDate] = React.useState<Date | undefined>();
  const [room, setRoom] = useState<Room | null>(null);
  const [adults, setAdults] = useState<number>(1);
  const [children, setChildren] = useState<number>(0);
  const navigate = useNavigate(); // Initialize the navigate function

  const { id } = useParams<{ id: string }>();

  useEffect(() => {
    if (!id) return; // If id is not available, return early

    const fetchRoomDetails = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rooms/${id}`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch room details");
        }
        const data: Room = await response.json();
        setRoom(data.room);
        console.log(data);
      } catch (error) {
        console.error("Error fetching room details:", error);
      }
    };

    fetchRoomDetails();
  }, [id]); // Fetch room details when id changes

  // Check if a date is booked
  const isBooked = (selectedDate: Date, bookedDates: Date[]) => {
    return bookedDates.some(
      (bookedDate) =>
        format(bookedDate, "yyyy-MM-dd") === format(selectedDate, "yyyy-MM-dd")
    );
  };
  const calculateNights = (checkIn: Date, checkOut: Date) => {
    return Math.ceil(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );
  };
  // Handle Check-in date selection
  const handleCheckInSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Ensure room.booked_date is passed correctly as the second argument
      if (isBooked(selectedDate, room?.booked_date || [])) {
        alert("This date is already booked. Please choose another date.");
        return;
      }

      // Ensure check-out date is after the check-in date
      if (checkOutDate && selectedDate >= checkOutDate) {
        alert("Check-in date must be before check-out date.");
        return;
      }
      setCheckInDate(selectedDate);
    }
  };
  // Handle Check-out date selection
  const handleCheckOutSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Ensure room.booked_date is passed correctly as the second argument
      if (isBooked(selectedDate, room?.booked_date || [])) {
        alert("This date is already booked. Please choose another date.");
        return;
      }
      if (checkInDate && selectedDate && selectedDate <= checkInDate) {
        alert("Check-out date must be after check-in date.");
        return;
      }
      setCheckOutDate(selectedDate);
    }
  };

  const handlePayment = () => {
    if (!isAuthenticated) {
      window.location.href = "/login";
      // handle the case where the user is not authenticated
      return;
    }
    if (!checkInDate || !checkOutDate) {
      alert("Please select both check-in and check-out dates.");
      return;
    }
    if (!room) {
      alert("Room information is missing.");
      return;
    }
    const nights = calculateNights(checkInDate, checkOutDate);
    if (nights <= 0) {
      alert("Invalid booking period. Please select valid dates.");
      return;
    }

    const totalPrice = room!.price * nights;

    // If both dates are selected and room info exists, navigate to the booking page with the relevant data
    navigate(`/paymentpage/${id}`, {
      state: {
        checkInDate,
        checkOutDate,
        adults,
        children,
        totalPrice,
        nights, // Pass the room object along with other state values
      },
    });
  };

  // const handleBooking = () => {
  //   if (!checkInDate || !checkOutDate) {
  //     alert("Please select both check-in and check-out dates.");
  //     return;
  //   }

  //   const nights = calculateNights(checkInDate, checkOutDate);
  //   if (nights <= 0) {
  //     alert("Invalid booking period. Please select valid dates.");
  //     return;
  //   }

  //   const totalPrice = room!.price * nights;
  //   handleEsewaPayment(totalPrice);
  // };

  const isAuthenticated = (() => {
    try {
      const token = localStorage.getItem("token"); // Get the token from localStorage
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1])); // Decode the JWT payload
        const currentTime = Math.floor(Date.now() / 1000); // Current time in seconds

        // Check if the token is not expired
        if (payload.exp && payload.exp > currentTime) {
          return true; // Token is valid and not expired
        }
      }
    } catch (error) {
      console.error("Error parsing JWT token:", error);
    }
    return false; // Default to false if no valid token or token is expired
  })();

  // const handleEsewaPayment = (amount: number) => {
  //   if (!isAuthenticated) {
  //     window.location.href = "/login";
  //     // handle the case where the user is not authenticated
  //     return;
  //   }
  //   const secretKey = "8gBm/:&EnhH.1/q"; // Replace with actual eSewa secret key
  //   const transactionUUID = `txn_${Date.now()}`; // Unique Transaction ID
  //   const productCode = "EPAYTEST"; // Replace with your Merchant Code
  //   const taxAmount = 0;
  //   const totalAmount = amount + taxAmount;
  //   const signedFieldNames = "total_amount,transaction_uuid,product_code";

  //   // Generate the eSewa signature
  //   const signature = CryptoJS.HmacSHA256(
  //     `total_amount=${totalAmount},transaction_uuid=${transactionUUID},product_code=${productCode}`,
  //     secretKey
  //   ).toString(CryptoJS.enc.Base64);

  //   // Create and submit the form dynamically
  //   const form = document.createElement("form");
  //   form.method = "POST";
  //   form.action = "https://rc-epay.esewa.com.np/api/epay/main/v2/form";

  //   const formData = {
  //     amount: amount,
  //     tax_amount: 0,
  //     total_amount: totalAmount,
  //     transaction_uuid: transactionUUID,
  //     product_code: productCode,
  //     product_service_charge: 0,
  //     product_delivery_charge: 0,
  //     success_url: "https://yourwebsite.com/payment-success",
  //     failure_url: `${API_URL}/api/rooms/${id}`,
  //     signed_field_names: signedFieldNames,
  //     signature: signature,
  //   };

  //   Object.entries(formData).forEach(([key, value]) => {
  //     const input = document.createElement("input");
  //     input.type = "hidden";
  //     input.name = key;
  //     input.value = String(value);
  //     form.appendChild(input);
  //   });

  //   document.body.appendChild(form);
  //   form.submit();
  // };

  const handleAdultChange = (increment: boolean) => {
    if (!room) return;
    setAdults((prev) =>
      Math.min(
        room.accommodation.Adults,
        Math.max(1, prev + (increment ? 1 : -1))
      )
    );
  };

  const handleChildrenChange = (increment: boolean) => {
    if (!room) return;
    setChildren((prev) =>
      Math.min(
        room.accommodation.Kids,
        Math.max(0, prev + (increment ? 1 : -1))
      )
    );
  };

  return (
    <div>
      <Navbar />
      <div className="mt-6 px-72 mb-4">
        <div className="flex gap-4">
          <img
            className="h-[516px] w-[750px] object-cover rounded-lg"
            src={room?.myImg[0]}
            alt="room"
          />
          <div className="flex flex-col gap-4">
            <img
              className="h-[250px] w-screen object-cover rounded-lg"
              src={room?.myImg[1]}
              alt="room"
            />
            <img
              className="h-[250px] w-screen object-cover rounded-lg"
              src={room?.myImg[2]}
              alt="room"
            />
          </div>
        </div>
        <div className="flex gap-4">
          <div
            style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
            className="mt-6 p-6 bg-white rounded-lg w-full"
          >
            <div className="flex items-center mb-4 gap-2">
              <MdOutlinePlaylistAddCheck className="text-[25px]" />
              <h1 className="text-[20px] font-semibold">Basic Amenities</h1>
            </div>

            <div>
              {room?.basic_amenities?.map((amenity, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <AiFillCheckCircle />
                  <h1 className="text-[15px] font-semibold">{amenity}</h1>
                </div>
              ))}
            </div>
          </div>
          <div
            style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
            className="mt-6 p-6 bg-white rounded-lg w-full"
          >
            {/* Check-in Section */}
            <div className="ml-1 flex items-center mb-2">
              <LuCalendarDays />
              <h1 className="ml-2 text-[15px] font-semibold">Check In:</h1>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !checkInDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {checkInDate ? (
                    format(checkInDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkInDate}
                  onSelect={handleCheckInSelect}
                  className="rounded-md border shadow"
                  modifiers={{
                    booked: (room?.booked_date || []).map(
                      (date) => new Date(date)
                    ), // Ensure it's a Date object
                    disabled: (date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to midnight
                      return date < today;
                    },
                  }}
                  modifiersClassNames={{
                    booked: "text-red-500 bg-red-100",
                    disabled: "text-gray-400 cursor-not-allowed", // Style for disabled dates
                  }}
                />
              </PopoverContent>
            </Popover>

            {/* Check-out Section */}
            <div className="ml-1 mt-4 flex items-center mb-2">
              <LuCalendarDays />
              <h1 className="ml-2 text-[15px] font-semibold">Check Out:</h1>
            </div>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-[240px] justify-start text-left font-normal",
                    !checkOutDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon />
                  {checkOutDate ? (
                    format(checkOutDate, "PPP")
                  ) : (
                    <span>Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={checkOutDate}
                  onSelect={handleCheckOutSelect}
                  className="rounded-md border shadow"
                  modifiers={{
                    booked: (room?.booked_date || []).map(
                      (date) => new Date(date)
                    ), // Ensure it's a Date object
                    disabled: (date) => {
                      const today = new Date();
                      today.setHours(0, 0, 0, 0); // Reset time to midnight
                      return date < today;
                    },
                  }}
                  modifiersClassNames={{
                    booked: "text-red-500 bg-red-100",
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="flex gap-4">
          <div
            style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
            className="mt-6 p-6 bg-white rounded-lg w-[49%]"
          >
            <div className="flex items-center mb-4 gap-2">
              <FaList />
              <h1 className="text-[20px] font-semibold">
                Room-Specific Amenities
              </h1>
            </div>

            <div>
              {room?.room_specific_amenities?.map((amenity, index) => (
                <div key={index} className="flex items-center mb-2 gap-2">
                  <AiFillCheckCircle />
                  <h1 className="text-[15px] font-semibold">{amenity}</h1>
                </div>
              ))}
            </div>
          </div>

          <div
            style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
            className="mt-6 p-6 bg-white rounded-lg w-[49%]"
          >
            <h1 className="text-[20px] font-semibold mb-4">
              Accommodation Details
            </h1>
            <div className="flex items-center mb-4 gap-2">
              <GiSupersonicBullet className="text-[15px]" />
              <label className="text-[15px] font-semibold">Adults:</label>
              <button
                onClick={() => handleAdultChange(false)}
                disabled={adults <= 1}
              >
                -
              </button>
              <span>{adults}</span>
              <button
                onClick={() => handleAdultChange(true)}
                disabled={adults >= (room?.accommodation?.Adults || 1)}
              >
                +
              </button>
            </div>

            <div className="flex items-center mb-4 gap-2">
              <GiSupersonicBullet className="text-[15px]" />
              <label className="text-[15px] font-semibold">Kids:</label>
              <button
                onClick={() => handleChildrenChange(false)}
                disabled={children <= 0}
              >
                -
              </button>
              <span>{children}</span>
              <button
                onClick={() => handleChildrenChange(true)}
                disabled={children >= (room?.accommodation?.Kids || 0)}
              >
                +
              </button>
            </div>
          </div>
        </div>

        <div className="flex justify-between gap-4">
          <div
            style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
            className="mt-6 p-6 bg-white rounded-lg w-full"
          >
            <div className="flex items-center mb-4 gap-2">
              <FaPeopleRoof className="text-[20px]" />
              <h1 className="text-[20px] font-semibold">Accommodation</h1>
            </div>

            <div>
              {Object.entries(room?.accommodation || {}).map(
                ([key, value], index) => (
                  <div key={index} className="flex items-center mb-2 gap-2">
                    <AiFillCheckCircle />
                    <h1 className="text-[15px] font-semibold">
                      {key}: {value}
                    </h1>
                  </div>
                )
              )}
            </div>
          </div>

          <Button
            onClick={() => handlePayment()}
            className="mt-auto w-full h-[58px] bg-[#DB5138] text-[#F7F7F7] text-[20px] font-bold"
          >
            Book Now
          </Button>
        </div>
        <div>
          <h1 className="mt-6 text-[20px] font-semibold">
            Reviews and Comments
          </h1>

          <Carousel>
            <CarouselContent className="-ml-1">
              {room?.reviews.map((review, index) => (
                <CarouselItem className="p-2 md:basis-1/2 lg:basis-1/3">
                  <div
                    key={index}
                    style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
                    className="p-6 bg-white rounded-lg w-full"
                  >
                    <div className="flex flex-col items-center">
                      <div className="flex items-center">
                        <h1 className="text-[15px] font-semibold">
                          {review.name}
                        </h1>
                      </div>
                      <div className="flex items-center">
                        {[...Array(review.rating)].map((_, i) => (
                          <AiFillStar key={i} className="text-yellow-500" />
                        ))}
                      </div>
                      <h1 className="text-[15px] font-semibold">
                        {review.comment}
                      </h1>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
          </Carousel>
        </div>
      </div>
      <Footer />
    </div>
  );
}
