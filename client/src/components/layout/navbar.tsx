import { Link, useNavigate } from "react-router-dom";
import { PiUserCircleLight } from "react-icons/pi";
import { ReactNode, useEffect, useState } from "react";
import { API_URL } from "@/constants/baseUrl";

interface JwtPayload {
  exp?: number;
  isAdmin?: boolean;
  name?: string;
}

interface HomepageData {
  contactInfo?: {
    homestayLogo: {
      public_id?: string;
      url: string;
    };
  };
}

export default function Navbar() {
  const navigate = useNavigate();
  const [logoUrl, setLogoUrl] = useState<string>("/bishramLogo.png"); // Fallback logo
  const [loading, setLoading] = useState<boolean>(true);

  let payload: JwtPayload | null = null;

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
        const fetchedLogoUrl = data?.contactInfo?.homestayLogo?.url;
        console.log("Fetched logo URL:", fetchedLogoUrl);
        if (fetchedLogoUrl) {
          setLogoUrl(fetchedLogoUrl);
        }
      } catch (error) {
        console.error("Error fetching logo:", error);
        // Fallback to default logo if fetch fails
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

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

  const isAuthenticated = ((): boolean => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1])) as JwtPayload;
        const currentTime = Math.floor(Date.now() / 1000);
        return !!payload.exp && payload.exp > currentTime;
      }
    } catch (error) {
      console.error("Error parsing JWT token:", error);
    }
    return false;
  })();

  return (
    <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50">
      <div
        style={{ boxShadow: "0 4px 18.4px 0 rgba(0,0,0,0.25)" }}
        className="px-36 flex justify-between items-center bg-white h-[90px]"
      >
        {/* Dynamic Logo */}
        {loading ? (
          <div className="h-[110px] w-[110px] bg-gray-200 animate-pulse" />
        ) : (
          <img
            className="h-[110px]"
            src={logoUrl}
            alt="Bishram Stay Logo"
            onError={(e) => {
              e.currentTarget.src = "/bishramLogo.png"; // Fallback on error
            }}
          />
        )}

        {/* Navigation Links */}
        <nav className="flex items-center gap-24">
          {!isAdmin && (
            <>
              <NavLink to="/">Home</NavLink>
              <NavLink to="/facilities">Facilities</NavLink>
              <NavLink to="/rooms">Rooms</NavLink>
              <NavLink to="/attraction">Attractions</NavLink>
              <NavLink to="/contact-us">Contact Us</NavLink>
            </>
          )}
        </nav>

        {/* Auth Section */}
        <div className="flex items-center">
          {!isAuthenticated ? (
            <div className="flex items-center gap-4">
              <AuthLink to="/login">LOG IN</AuthLink>
              <AuthLink to="/signup" primary>
                SIGN UP
              </AuthLink>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <div
                className="flex items-center gap-2 cursor-pointer group"
                onClick={() => navigate("/account")}
              >
                <PiUserCircleLight className="h-8 w-8 text-gray-600 group-hover:text-[#DB5138]" />
                <span className="text-gray-700 group-hover:text-[#DB5138]">
                  {payload?.name || "Account"}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

interface NavLinkProps {
  to: string;
  children: ReactNode;
}

const NavLink = ({ to, children }: NavLinkProps) => (
  <Link
    to={to}
    className="text-[18px] font-medium text-gray-700 hover:text-[#DB5138] transition-colors"
  >
    {children}
  </Link>
);

interface AuthLinkProps {
  to: string;
  children: ReactNode;
  primary?: boolean;
}

const AuthLink = ({ to, children, primary = false }: AuthLinkProps) => (
  <Link
    to={to}
    className={`text-[16px] font-bold ${
      primary
        ? "text-white bg-[#DB5138] px-4 py-2 rounded-md hover:bg-[#c1452e]"
        : "text-[#DB5138] hover:underline"
    }`}
  >
    {children}
  </Link>
);
