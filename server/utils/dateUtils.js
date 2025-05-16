// utils/dateUtils.js
function formatDate(date) {
  const yy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0"); // Month is 0-based
  const dd = String(date.getDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

function getDatesBetween(startDate, endDate) {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);

  while (current <= end) {
    dates.push(formatDate(new Date(current))); // Format each date before adding
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

module.exports = { getDatesBetween };
