const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

function getISTDate(date = new Date()) {
  return new Date(date.getTime() + IST_OFFSET_MS);
}

// Mocking UTC 12:12 PM (IST 5:42 PM)
const mockDate = new Date("2026-04-24T12:12:00Z"); 
const ist = getISTDate(mockDate);

console.log("UTC Time:", mockDate.toISOString());
console.log("IST Wall Clock (via shift):", ist.toISOString());
console.log("Hour (getUTCHours):", ist.getUTCHours());
console.log("Greeting:", ist.getUTCHours() < 12 ? "Good morning" : ist.getUTCHours() < 17 ? "Good afternoon" : "Good evening");
