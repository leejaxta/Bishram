import { MdOutlineBedroomChild } from "react-icons/md";
import { LuHandCoins } from "react-icons/lu";
import { BsGraphUpArrow } from "react-icons/bs";
import { CgDetailsMore } from "react-icons/cg";
import { FaUsers } from "react-icons/fa6";
import { SiCcleaner } from "react-icons/si";
import { IoLocation } from "react-icons/io5";
import { useLocation } from "react-router-dom";

export default function Sidebar() {
  const location = useLocation();

  // Define navigation items
  const navItems = [
    {
      path: "/facilitydashboard",
      icon: <LuHandCoins className="text-lg" />,
      label: "Facility",
    },
    {
      path: "/roomdashboard",
      icon: <MdOutlineBedroomChild className="text-lg" />,
      label: "Room",
    },
    {
      path: "/bookinggraph",
      icon: <BsGraphUpArrow className="text-lg" />,
      label: "Daily Bookings",
    },
    {
      path: "/currentusers",
      icon: <FaUsers className="text-lg" />,
      label: "Current Users",
    },
    {
      path: "/roomcleaning",
      icon: <SiCcleaner className="text-lg" />,
      label: "Room Cleaning",
    },
    {
      path: "/adminattractions",
      icon: <IoLocation className="text-lg" />,
      label: "Attractions",
    },
    {
      path: "/adminhome",
      icon: <CgDetailsMore className="text-lg" />,
      label: "HomeStay Details",
    },
  ];

  return (
    <div
      style={{ boxShadow: "4px 0 15px rgba(0, 0, 0, 0.1)" }}
      className="z-0 fixed left-0 h-screen overflow-y-auto w-64 bg-white px-6 py-8 transition-all duration-300"
    >
      {/* Logo/Branding Area */}
      <div className="mb-10 px-2">
        <h1 className="text-2xl font-bold text-[#DB5138]">Admin Panel</h1>
      </div>

      {/* Main Navigation */}
      <div className="flex flex-col gap-1">
        <h2 className="text-sm uppercase font-semibold text-gray-500 tracking-wider mb-4 px-2">
          Dashboard
        </h2>

        {/* Navigation Items */}
        {navItems.map((item, index) => (
          <div
            key={index}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg cursor-pointer ${
              location.pathname === item.path
                ? "bg-[#FFF0ED] text-[#DB5138]"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            onClick={() => {
              window.location.href = item.path;
            }}
          >
            {item.icon}
            <span className="font-medium">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
