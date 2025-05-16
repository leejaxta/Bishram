import { useState, useEffect } from "react";
import Navbar from "../components/layout/navbar";
import { LuNotebookPen } from "react-icons/lu";
import { Button } from "@/components/ui/button";
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
}

export default function Homepage() {
  const [homepageData, setHomepageData] = useState<HomepageData>({
    heroTitle: "WELCOME TO",
    heroMainTitle: "BISHRAM",
    heroSubtitle: "STAY",
    heroImage: { url: "./front-min.png" },
    sections: [
      {
        title: "Luxury Redefined",
        description:
          "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
        image: { url: "./front1.png" },
        buttonText: "Explore",
      },
      {
        title: "Luxury Redefined",
        description:
          "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
        image: { url: "./front1.png" },
        buttonText: "Explore",
      },
    ],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHomepageData = async () => {
      try {
        const response = await fetch(`${API_URL}/api/homepage`);
        if (!response.ok) {
          throw new Error(
            `Failed to fetch homepage data: ${response.statusText}`
          );
        }
        const data = await response.json();
        if (data) {
          setHomepageData(data);
        }
      } catch (error) {
        console.error("Error fetching homepage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchHomepageData();
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Navbar />
        <div>Loading...</div>
        <Footer />
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <img
        className="h-[900px] w-full absolute z-[-1]"
        src={homepageData.heroImage.url}
        alt="Bishram Stay"
      />
      <div className="pt-[230px] pl-16">
        <div className="text-[#DB5138]">
          <h1 className="text-[50px]">{homepageData.heroTitle}</h1>
          <h1 className="text-[130px] font-bold">
            {homepageData.heroMainTitle}
          </h1>
          <h1 className="text-[60px] font-bold">{homepageData.heroSubtitle}</h1>
        </div>
      </div>
      <div className="mt-14 flex justify-center items-center">
        <Button
          onClick={() => {
            window.location.href = "/rooms";
          }}
          className="w-[170px] h-[58px] bg-[#DB5138] text-[#F7F7F7] text-[20px] font-bold"
        >
          <LuNotebookPen />
          BOOK NOW
        </Button>
      </div>
      <div className="mt-[250px] px-36 mb-36">
        {homepageData.sections.map((section, index) => (
          <div key={index} className="flex justify-between mb-[60px]">
            <div className="flex">
              <div className="h-[350px] border border-black"></div>
              <div className="ml-[60px] w-[500px]">
                <h1 className="text-[60px] font-semibold">{section.title}</h1>
                <h1 className="mt-[15px] text-[25px]">{section.description}</h1>
                <Button
                  onClick={() => {
                    window.location.href = "/rooms";
                  }}
                  className="mt-[30px] w-[140px] h-[48px] bg-[#DB5138]"
                >
                  {section.buttonText}
                </Button>
              </div>
            </div>
            <img
              className="w-[500px] h-[350px]"
              src={section.image.url}
              alt={`Section ${index + 1}`}
            />
          </div>
        ))}
      </div>
      <Footer />
    </div>
  );
}
