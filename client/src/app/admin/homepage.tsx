import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API_URL } from "@/constants/baseUrl";
import Navbar from "@/components/layout/navbar";
import Sidebar from "@/components/layout/sidebar";

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

const defaultSection = {
  title: "Luxury Redefined",
  description:
    "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
  image: { url: "" },
  buttonText: "Explore",
};

const defaultContactInfo = {
  address: "Jhatapole, Lalitpur, Nepal",
  phone: "+977 1234567890",
  email: "leejasshrestha@gmail.com",
  homestayName: "Bishram Stay",
  homestayLogo: { url: "" },
};

export default function HomepageEditor() {
  const [homepageData, setHomepageData] = useState<HomepageData>({
    heroTitle: "WELCOME TO",
    heroMainTitle: "BISHRAM",
    heroSubtitle: "STAY",
    heroImage: { url: "" },
    sections: [defaultSection, defaultSection],
    contactInfo: defaultContactInfo,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const token = localStorage.getItem("token"); // Retrieve token
        const response = await fetch(`${API_URL}/api/homepage`, {
          headers: {
            Authorization: `Bearer ${token || ""}`, // Ensure token is a string
          },
        });
        if (!response.ok) {
          throw new Error(
            `Failed to fetch homepage data: ${response.statusText}`
          );
        }
        const data = await response.json();
        console.log("Fetched data:", data); // Debug the API response
        if (data) {
          const sections =
            Array.isArray(data.sections) && data.sections.length > 0
              ? data.sections
              : [defaultSection, defaultSection];

          // Ensure contactInfo is properly handled with all fields
          const contactInfo = {
            ...defaultContactInfo,
            ...data.contactInfo,
            // Make sure homestayLogo is properly handled
            homestayLogo: data.contactInfo?.homestayLogo || { url: "" },
          };

          setHomepageData({
            ...data,
            sections,
            contactInfo,
          });
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
        setError("Failed to load homepage data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    sectionIndex?: number,
    field?: string
  ) => {
    const { name, value } = e.target;

    if (sectionIndex !== undefined && field) {
      // Handling section fields
      const updatedSections = [...homepageData.sections];
      updatedSections[sectionIndex] = {
        ...updatedSections[sectionIndex],
        [field]: value,
      };
      setHomepageData({ ...homepageData, sections: updatedSections });
    } else if (field && field in defaultContactInfo) {
      // Handling contactInfo fields
      setHomepageData({
        ...homepageData,
        contactInfo: {
          ...homepageData.contactInfo,
          [field]: value,
        },
      });
    } else {
      // Handling main fields
      setHomepageData({ ...homepageData, [name]: value });
    }
  };

  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "hero" | "section" | "homestay-logo",
    sectionIndex?: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) {
      setError("No file selected for upload.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      const token = localStorage.getItem("token"); // Retrieve token
      if (!token) {
        setError("You must be logged in to upload images.");
        navigate("/login"); // Redirect to login if not authenticated
        return;
      }

      let endpoint;
      if (type === "hero") {
        endpoint = `${API_URL}/api/homepage/upload/hero`;
      } else if (type === "section") {
        endpoint = `${API_URL}/api/homepage/upload/section/${sectionIndex}`;
      } else if (type === "homestay-logo") {
        endpoint = `${API_URL}/api/homepage/upload/homestay-logo`;
      } else {
        throw new Error(`Invalid type: ${type}`);
      }

      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`, // Add token to headers
        },
      });

      if (!response.ok) {
        throw new Error(`Image upload failed: ${response.statusText}`);
      }

      const updatedData = await response.json();

      // Ensure contactInfo preservation when getting updated data
      const updatedContactInfo = {
        ...homepageData.contactInfo,
        ...updatedData.contactInfo,
      };

      setHomepageData({
        ...updatedData,
        contactInfo: updatedContactInfo,
      });
      setError(null);
    } catch (error) {
      console.error("Error uploading image:", error);
      setError("Failed to upload image. Please try again.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You must be logged in to save changes.");
        navigate("/login");
        return;
      }

      // Ensure all contactInfo fields are included in the submission
      const dataToSubmit = {
        ...homepageData,
        contactInfo: {
          address: homepageData.contactInfo.address,
          phone: homepageData.contactInfo.phone,
          email: homepageData.contactInfo.email,
          homestayName: homepageData.contactInfo.homestayName,
          homestayLogo: homepageData.contactInfo.homestayLogo,
        },
      };

      console.log("Submitting data:", dataToSubmit);

      const response = await fetch(`${API_URL}/api/homepage`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, // Add token to headers
        },
        body: JSON.stringify(dataToSubmit),
      });

      if (!response.ok) {
        throw new Error(`Failed to update homepage: ${response.statusText}`);
      }

      const updatedData = await response.json();
      alert("Homepage updated successfully!");

      // Update with the response from server
      setHomepageData(updatedData);
      setError(null);
    } catch (error) {
      console.error("Error updating homepage:", error);
      setError("Failed to update homepage. Please try again.");
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8">Loading...</div>;
  }

  return (
    <div className="container mx-auto px-4 ">
      <Navbar />
      <Sidebar />
      <div className="ml-[118px]  py-8">
        <h1 className="text-3xl font-bold mb-8">Edit Homepage</h1>

        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* Hero Section */}
          <div className="mb-12 p-6 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Hero Section</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Hero Title</label>
                <input
                  type="text"
                  name="heroTitle"
                  value={homepageData.heroTitle}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Main Title</label>
                <input
                  type="text"
                  name="heroMainTitle"
                  value={homepageData.heroMainTitle}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Subtitle</label>
                <input
                  type="text"
                  name="heroSubtitle"
                  value={homepageData.heroSubtitle}
                  onChange={handleInputChange}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Hero Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "hero")}
                  className="w-full p-2 border rounded"
                />
                {homepageData.heroImage?.url && (
                  <div className="mt-2">
                    <img
                      src={homepageData.heroImage.url}
                      alt="Hero"
                      className="w-32 h-auto rounded shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Content Sections */}
          {homepageData.sections.map((section, index) => (
            <div
              key={index}
              className="mb-12 p-6 bg-gray-50 rounded-lg shadow-sm"
            >
              <h2 className="text-2xl font-semibold mb-4">
                Section {index + 1}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block mb-2 font-medium">Title</label>
                  <input
                    type="text"
                    value={section.title}
                    onChange={(e) => handleInputChange(e, index, "title")}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Button Text</label>
                  <input
                    type="text"
                    value={section.buttonText}
                    onChange={(e) => handleInputChange(e, index, "buttonText")}
                    className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block mb-2 font-medium">Description</label>
                  <textarea
                    value={section.description}
                    onChange={(e) => handleInputChange(e, index, "description")}
                    className="w-full p-2 border rounded h-32 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block mb-2 font-medium">Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, "section", index)}
                    className="w-full p-2 border rounded"
                  />
                  {section.image?.url && (
                    <div className="mt-2">
                      <img
                        src={section.image.url}
                        alt={`Section ${index + 1}`}
                        className="w-32 h-auto rounded shadow-sm"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Contact Information Section */}
          <div className="mb-12 p-6 bg-gray-50 rounded-lg shadow-sm">
            <h2 className="text-2xl font-semibold mb-4">Contact Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block mb-2 font-medium">Address</label>
                <input
                  type="text"
                  name="address"
                  value={homepageData.contactInfo.address}
                  onChange={(e) => handleInputChange(e, undefined, "address")}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={homepageData.contactInfo.phone}
                  onChange={(e) => handleInputChange(e, undefined, "phone")}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Email</label>
                <input
                  type="email"
                  name="email"
                  value={homepageData.contactInfo.email}
                  onChange={(e) => handleInputChange(e, undefined, "email")}
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Homestay Name</label>
                <input
                  type="text"
                  name="homestayName"
                  value={homepageData.contactInfo.homestayName}
                  onChange={(e) =>
                    handleInputChange(e, undefined, "homestayName")
                  }
                  className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block mb-2 font-medium">Homestay Logo</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "homestay-logo")}
                  className="w-full p-2 border rounded"
                />
                {homepageData.contactInfo?.homestayLogo?.url && (
                  <div className="mt-2">
                    <img
                      src={homepageData.contactInfo.homestayLogo.url}
                      alt="Homestay Logo"
                      className="w-32 h-auto rounded shadow-sm"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between mb-6">
            <div></div>
            <button
              type="submit"
              className="px-6 py-2 bg-[#DB5138] hover:bg-[#DB5138]/90 text-white rounded-md"
            >
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
