import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import Navbar from "@/components/layout/navbar";
import Footer from "@/components/layout/footer";
import { API_URL } from "@/constants/baseUrl";

interface HomepageData {
  heroTitle: string;
  heroMainTitle: string;
  heroSubtitle: string;
  heroImage: {
    public_id?: string;
    url: string;
  };
  sections: Array<{
    title: string;
    description: string;
    image: {
      public_id?: string;
      url: string;
    };
    buttonText: string;
  }>;
  contactInfo: {
    address: string;
    phone: string;
    email: string;
    homestayName: string;
    homestayLogo: {
      public_id?: string;
      url: string;
    };
  };
}

interface LocationData {
  lat: number;
  lng: number;
}

export default function ContactUs() {
  const [formData, setFormData] = React.useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const [contactData, setContactData] = useState<HomepageData | null>(null);
  const [locationData, setLocationData] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch contact information and homestay details
        const homepageResponse = await fetch(`${API_URL}/api/homepage`);
        if (!homepageResponse.ok) {
          throw new Error(
            `Failed to fetch homepage data: ${homepageResponse.statusText}`
          );
        }
        const homepageData = await homepageResponse.json();
        setContactData(homepageData);

        // Fetch location coordinates
        const locationResponse = await fetch(
          `${API_URL}/api/attractions/homestay/location`
        );
        if (!locationResponse.ok) {
          throw new Error(
            `Failed to fetch location data: ${locationResponse.statusText}`
          );
        }
        const locationData = await locationResponse.json();
        console.log("Location data response:", locationData);

        // Check if location data has coords property based on your API response
        if (
          locationData &&
          locationData.coords &&
          Array.isArray(locationData.coords) &&
          locationData.coords.length === 2
        ) {
          setLocationData({
            lat: locationData.coords[0],
            lng: locationData.coords[1],
          });
        } else if (Array.isArray(locationData) && locationData.length === 2) {
          // Handle if response is a direct array of coordinates
          setLocationData({
            lat: locationData[0],
            lng: locationData[1],
          });
        } else {
          console.error("Unexpected location data format:", locationData);
          // Fall back to default coords
          setLocationData({ lat: 27.675864552066322, lng: 85.32510050761249 });
        }
      } catch (err) {
        console.error("Error fetching data:", err);

        setContactData({
          heroTitle: "Contact Us",
          heroMainTitle: "",
          heroSubtitle: "",
          heroImage: { url: "" },
          sections: [],
          contactInfo: {
            address: "Jhatapole, Lalitpur, Nepal",
            phone: "+977 1234567890",
            email: "leejasshrestha@gmail.com",
            homestayName: "Bishram Stay",
            homestayLogo: { url: "" },
          },
        });
        setLocationData({ lat: 27.675864552066322, lng: 85.32510050761249 });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Create a more reliable Google Maps URL
  const getGoogleMapsEmbedUrl = () => {
    if (!locationData) return "";

    // Format for more reliable embed
    return `https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${locationData.lat},${locationData.lng}&zoom=16`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-20 text-center">
          Loading...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      {/* Hero Section */}
      <div className="bg-[#DB5138] text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Contact Us</h1>
          <p className="text-xl md:text-2xl max-w-2xl mx-auto">
            We'd love to hear from you! Reach out with any questions or
            feedback.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Contact Form (unchanged) */}
          <div className="bg-white p-8 rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              Send us a message
            </h2>

            <form
              action="https://formspree.io/f/mdkgzvov"
              method="POST"
              className="space-y-6"
            >
              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Full Name
                </label>
                <Input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Email Address
                </label>
                <Input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="phone"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Phone Number
                </label>
                <Input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className="w-full"
                />
              </div>

              <div>
                <label
                  htmlFor="message"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Your Message
                </label>
                <Textarea
                  id="message"
                  name="message"
                  rows={5}
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-[#DB5138] hover:bg-[#c0452e]"
              >
                Send Message
              </Button>
            </form>
          </div>

          {/* Contact Information */}
          <div className="space-y-8">
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Contact Information
              </h2>

              <div className="space-y-4">
                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#f8e0dc] p-3 rounded-full">
                    <svg
                      className="h-6 w-6 text-[#DB5138]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Address
                    </h3>
                    <p className="text-gray-600">
                      {contactData?.contactInfo.address ||
                        "Jhatapole, Lalitpur, Nepal"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#f8e0dc] p-3 rounded-full">
                    <svg
                      className="h-6 w-6 text-[#DB5138]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Phone</h3>
                    <p className="text-gray-600">
                      {contactData?.contactInfo.phone || "+977 1234567890"}
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <div className="flex-shrink-0 bg-[#f8e0dc] p-3 rounded-full">
                    <svg
                      className="h-6 w-6 text-[#DB5138]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-medium text-gray-900">Email</h3>
                    <p className="text-gray-600">
                      {contactData?.contactInfo.email ||
                        "leejasshrestha@gmail.com"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Map */}
            <div className="bg-white p-8 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold mb-6 text-gray-800">
                Our Location
              </h2>
              <div className="aspect-w-16 aspect-h-9">
                {locationData && (
                  <iframe
                    src={getGoogleMapsEmbedUrl()}
                    width="100%"
                    height="400"
                    style={{ border: 0 }}
                    allowFullScreen
                    loading="lazy"
                    className="rounded-lg"
                  ></iframe>
                )}
                <div className="mt-3 text-sm text-gray-500">
                  {locationData && (
                    <p>
                      Location: {locationData.lat}, {locationData.lng}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
