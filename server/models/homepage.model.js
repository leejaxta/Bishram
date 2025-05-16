const mongoose = require("mongoose");

const homepageSchema = new mongoose.Schema({
  heroTitle: String,
  heroMainTitle: String,
  heroSubtitle: String,
  heroImage: {
    public_id: String,
    url: String,
  },
  sections: [
    {
      title: String,
      description: String,
      image: {
        public_id: String,
        url: String,
      },
      buttonText: String,
    },
  ],
  contactInfo: {
    address: String,
    phone: String,
    email: String,
    homestayName: String,
    homestayLogo: {
      public_id: String,
      url: String,
    },
  },
});

module.exports = mongoose.model("Homepage", homepageSchema);
