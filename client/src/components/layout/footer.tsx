import { useEffect, useState } from "react";
import { API_URL } from "@/constants/baseUrl";

interface ContactInfo {
  address: string;
  phone: string;
  email: string;
  homestayName: string;
  homestayLogo?: {
    public_id?: string;
    url: string;
  };
}

interface HomepageData {
  contactInfo?: ContactInfo;
}

export default function Footer() {
  const [homestayName, setHomestayName] = useState<string>("Bishram Stay"); // Fallback name
  const [contactInfo, setContactInfo] = useState<ContactInfo>({
    address: "Kathmandu, Nepal",
    phone: "+977 9841000000",
    email: "info@homestayhaven.com",
    homestayName: "Bishram Stay",
  });

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/homepage`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch homepage data: ${response.statusText}`
          );
        }
        const data: HomepageData = await response.json();
        if (data.contactInfo) {
          setHomestayName(data.contactInfo.homestayName || "Bishram Stay");
          setContactInfo({
            address: data.contactInfo.address || "Kathmandu, Nepal",
            phone: data.contactInfo.phone || "+977 9841000000",
            email: data.contactInfo.email || "info@homestayhaven.com",
            homestayName: data.contactInfo.homestayName || "Bishram Stay",
          });
        }
      } catch (error) {
        console.error("Error fetching footer data:", error);
        // Fallback to default values if fetch fails
      }
    };

    fetchHomepageData();
  }, []);

  return (
    <footer className="bg-[#1A1A1A] text-white">
      <div
        style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
        className="px-36 py-12 flex flex-col md:flex-row justify-between"
      >
        {/* Company Info */}
        <div className="mb-8 md:mb-0">
          <h3 className="text-xl font-bold mb-4">{homestayName}</h3>
          <p className="max-w-xs text-gray-400 mb-4">
            Discover authentic local experiences with our homestay
          </p>
          <div className="flex space-x-4">
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-facebook-f"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="#" className="text-gray-400 hover:text-white">
              <i className="fab fa-instagram"></i>
            </a>
          </div>
        </div>

        {/* Destinations */}
        <div className="mb-8 md:mb-0">
          <h4 className="text-lg font-semibold mb-4">Popular Destinations</h4>
          <ul className="space-y-2 text-gray-400">
            <li>Kathmandu</li>
            <li>Pokhara</li>
            <li>Chitwan</li>
            <li>Lumbini</li>
          </ul>
        </div>

        {/* Contact Info */}
        <div>
          <h4 className="text-lg font-semibold mb-4">Contact Us</h4>
          <ul className="space-y-2 text-gray-400">
            <li className="flex items-center">
              <i className="fas fa-map-marker-alt mr-2"></i>
              {contactInfo.address}
            </li>
            <li className="flex items-center">
              <i className="fas fa-phone-alt mr-2"></i>
              {contactInfo.phone}
            </li>
            <li className="flex items-center">
              <i className="fas fa-envelope mr-2"></i>
              {contactInfo.email}
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div className="bg-black py-4 text-center text-gray-500 text-sm">
        <p>
          © {new Date().getFullYear()} {homestayName}. All rights reserved.
        </p>
        <div className="mt-2 flex justify-center">
          <p className=" mx-2">Privacy Policy</p>
          <p className="mx-2">Terms of Service</p>
        </div>
      </div>
    </footer>
  );
}
