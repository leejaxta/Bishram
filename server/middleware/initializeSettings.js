// middlewares/initializeSettings.js
const Setting = require("../models/setting.model");

module.exports = async function initializeSettings() {
  try {
    // This will create a settings document if one doesn't exist
    await Setting.getSingleton();
    console.log("Settings initialized");
  } catch (err) {
    console.error("Failed to initialize settings:", err);
  }
};
