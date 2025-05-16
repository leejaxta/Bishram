const Homepage = require("../models/homepage.model");
const cloudinary = require("cloudinary").v2;
require("dotenv").config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Get homepage content
const getHomepage = async (req, res) => {
  try {
    const homepage = await Homepage.findOne();
    if (!homepage) {
      const newHomepage = new Homepage({
        sections: [
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
        ],
        contactInfo: {
          address: "Jhatapole, Lalitpur, Nepal",
          phone: "+977 1234567890",
          email: "leejasshrestha@gmail.com",
          homestayName: "Bishram Stay",
          homestayLogo: { public_id: "", url: "" },
        },
      });
      await newHomepage.save();
      return res.json(newHomepage);
    }
    res.json(homepage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update homepage content (including contact info)
const updateHomepage = async (req, res) => {
  try {
    const { heroTitle, heroMainTitle, heroSubtitle, sections, contactInfo } =
      req.body;

    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({
        sections: [
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
        ],
        contactInfo: {
          address: "Jhatapole, Lalitpur, Nepal",
          phone: "+977 1234567890",
          email: "leejasshrestha@gmail.com",
          homestayName: "Bishram Stay",
          homestayLogo: { public_id: "", url: "" },
        },
      });
    }

    if (heroTitle) homepage.heroTitle = heroTitle;
    if (heroMainTitle) homepage.heroMainTitle = heroMainTitle;
    if (heroSubtitle) homepage.heroSubtitle = heroSubtitle;
    if (sections && Array.isArray(sections)) homepage.sections = sections;
    if (contactInfo) {
      homepage.contactInfo = {
        ...homepage.contactInfo,
        ...contactInfo,
      };
    }

    await homepage.save();
    res.json(homepage);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Upload hero image (unchanged)
const uploadHeroImage = async (req, res) => {
  try {
    console.log("req.file:", req.file);
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "homepage" },
        (error, result) => {
          console.log("Cloudinary upload error:", error);
          console.log("Cloudinary upload result:", result);
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({
        sections: [
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
        ],
        contactInfo: {
          address: "Jhatapole, Lalitpur, Nepal",
          phone: "+977 1234567890",
          email: "leejasshrestha@gmail.com",
          homestayName: "Bishram Stay",
          homestayLogo: { public_id: "", url: "" },
        },
      });
    }

    if (homepage.heroImage?.public_id) {
      try {
        await cloudinary.uploader.destroy(homepage.heroImage.public_id);
      } catch (destroyError) {
        console.error("Error deleting old hero image:", destroyError);
      }
    }

    console.log("Saving heroImage:", {
      public_id: result.public_id,
      url: result.secure_url,
    });
    homepage.heroImage = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await homepage.save();
    console.log("Updated homepage:", homepage);
    res.json(homepage);
  } catch (err) {
    console.error("Error in uploadHeroImage:", err);
    res.status(500).json({ message: err.message, stack: err.stack });
  }
};

// Upload section image (unchanged)
const uploadSectionImage = async (req, res) => {
  try {
    const index = parseInt(req.params.index);
    if (isNaN(index) || index < 0) {
      return res.status(400).json({ message: "Invalid section index" });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "homepage" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({
        sections: [
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
        ],
        contactInfo: {
          address: "Jhatapole, Lalitpur, Nepal",
          phone: "+977 1234567890",
          email: "leejasshrestha@gmail.com",
          homestayName: "Bishram Stay",
          homestayLogo: { public_id: "", url: "" },
        },
      });
    }

    if (!homepage.sections[index]) {
      homepage.sections[index] = {
        title: "Luxury Redefined",
        description:
          "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
        image: { public_id: "", url: "" },
        buttonText: "Explore",
      };
    }

    if (homepage.sections[index].image?.public_id) {
      await cloudinary.uploader.destroy(
        homepage.sections[index].image.public_id
      );
    }

    homepage.sections[index].image = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await homepage.save();
    res.json(homepage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Upload homestay logo
const uploadHomestayLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }

    const result = await new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        { folder: "homepage" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );
      uploadStream.end(req.file.buffer);
    });

    let homepage = await Homepage.findOne();
    if (!homepage) {
      homepage = new Homepage({
        sections: [
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
          {
            title: "Luxury Redefined",
            description:
              "Our rooms are designed to transport you into an environment made for leisure. Take your mind off the day-to-day of home life and find a private paradise for yourself.",
            image: { public_id: "", url: "" },
            buttonText: "Explore",
          },
        ],
        contactInfo: {
          address: "Jhatapole, Lalitpur, Nepal",
          phone: "+977 1234567890",
          email: "leejasshrestha@gmail.com",
          homestayName: "Bishram Stay",
          homestayLogo: { public_id: "", url: "" },
        },
      });
    }

    if (homepage.contactInfo.homestayLogo?.public_id) {
      await cloudinary.uploader.destroy(
        homepage.contactInfo.homestayLogo.public_id
      );
    }

    homepage.contactInfo.homestayLogo = {
      public_id: result.public_id,
      url: result.secure_url,
    };

    await homepage.save();
    res.json(homepage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getHomepage,
  updateHomepage,
  uploadHeroImage,
  uploadSectionImage,
  uploadHomestayLogo,
};
