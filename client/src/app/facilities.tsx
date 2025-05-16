import Footer from "@/components/layout/footer";
import Navbar from "@/components/layout/navbar";
import { useEffect, useState } from "react";
import { API_URL } from "@/constants/baseUrl";

interface Facility {
  id: string;
  name: string;
  myImg: string; // Assume the image is stored as a base64 string or a URL in the database
}

export default function Facilities() {
  const [facilities, setFacilities] = useState<Facility[]>([]);

  // Fetch facilities data from the backend
  useEffect(() => {
    const fetchFacilities = async () => {
      try {
        const response = await fetch(`${API_URL}/api/facilities`, {
          method: "GET",
        });
        if (!response.ok) {
          throw new Error("Failed to fetch facilities");
        }
        const data: Facility[] = await response.json();
        setFacilities(data);
      } catch (error) {
        console.error("Error fetching facilities:", error);
      }
    };

    fetchFacilities();
  }, []);

  return (
    <div>
      <Navbar />
      <div className="mt-6 mb-16 px-36">
        <div>
          <h1 className="justify-self-center text-[40px] font-semibold">
            Facilities
          </h1>
        </div>

        <div className="mt-10 grid grid-cols-3 gap-16">
          {facilities.length > 0 ? (
            facilities.map((facility) => (
              <div key={facility.id}>
                <img
                  className="h-[300px] w-full object-cover rounded-t-lg"
                  src={facility.myImg} // This assumes `myImg` is a URL
                  alt={facility.name}
                />
                <div className="w-full bg-[#DB5138] rounded-b-lg">
                  <h1 className="text-[25px] text-white font-semibold justify-self-center">
                    {facility.name.toUpperCase()}
                  </h1>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500">
              No facilities available.
            </p>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
}
