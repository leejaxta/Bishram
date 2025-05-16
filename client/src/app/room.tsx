import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import React, { useEffect, useState } from "react";
import { API_URL } from "@/constants/baseUrl";
import { CiCirclePlus } from "react-icons/ci";
import { useNavigate } from "react-router-dom"; // Import useNavigate from react-router-dom

interface Room {
  _id: string;
  name: string;
  myImg: Array<string>;
  price: number;
}

export default function Room() {
  const [rooms, setRooms] = useState<Room[]>([]);
  const navigate = useNavigate(); // Initialize useNavigate hook

  // Fetch rooms data from the backend
  useEffect(() => {
    const fetchRooms = async () => {
      try {
        const response = await fetch(`${API_URL}/api/rooms`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch rooms");
        }
        const data: Room[] = await response.json();
        setRooms(data);
      } catch (error) {
        console.error("Error fetching rooms:", error);
      }
    };

    fetchRooms();
  }, []);

  // Handle click to navigate to room details page
  const handleRoomClick = (roomId: string) => {
    navigate(`/roomdetails/${roomId}`); // Pass roomId in the URL
  };

  return (
    <div>
      <Navbar />
      <div className="mt-6 mb-16 px-36">
        <div>
          <h1 className="justify-self-center text-[40px] font-semibold">
            Rooms
          </h1>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-16">
          {rooms.length > 0 ? (
            rooms.map((room) => (
              <div
                key={room._id}
                className="rounded-lg hover:shadow-2xl transition-shadow duration-300 ease-in-out cursor-pointer"
                onClick={() => handleRoomClick(room._id)} // Pass room id when clicked
              >
                <div className="relative z-[-1]">
                  <img
                    className="h-[300px] w-full object-cover rounded-t-lg"
                    src={room.myImg[0]}
                    alt={room.name}
                  />

                  <div className="bg-[#E0B973] h-[25px] w-[140px] absolute bottom-0 right-0 rounded-l-md">
                    <h2 className="absolute bottom-[3px] right-2 text-[13px] font-medium text-white">
                      Rs. {room.price} per night
                    </h2>
                  </div>
                </div>

                <div className="w-full bg-[#DB5138]">
                  <h1 className="text-[25px] text-white font-semibold justify-self-center">
                    {room.name.toUpperCase()}
                  </h1>
                </div>
                <div className="p-3 w-full bg-[#faf6f6] flex gap-3 rounded-b-lg">
                  <CiCirclePlus className="mt-[5px] text-[20px] text-black justify-self-center" />
                  <h1 className="text-[20px] text-black font-semibold justify-self-center">
                    View Room Details
                  </h1>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500">
              No Rooms available.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
