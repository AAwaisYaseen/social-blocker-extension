let blockedSites = [];
let focusedHours = { start: "", end: "" };
let blockedPagePath = "src/components/blocked/blocked.html";

function updateSettings() {
  chrome.storage.sync.get(["blockedSites", "focusedHours"], (data) => {
    blockedSites = data.blockedSites || [];
    focusedHours = data.focusedHours || { start: "", end: "" };

    if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest)) {
      chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
    }

    if (blockedSites.length > 0) {
      chrome.webRequest.onBeforeRequest.addListener(
        blockRequest,
        { urls: blockedSites, types: ["main_frame"] },
        ["blocking"]
      );
    }
  });
}

function isWithinFocusedHours() {
  if (!focusedHours.start || !focusedHours.end) {
    return true;
  }

  const now = new Date();
  const start = parseTime(focusedHours.start);
  const end = parseTime(focusedHours.end);
  const currentTime = now.getHours() * 60 + now.getMinutes();

  if (start <= end) {
    // Focused hours are within the same day
    return currentTime >= start && currentTime < end;
  } else {
    // Focused hours cross midnight
    return currentTime >= start || currentTime < end;
  }
}

// Function to parse time string "HH:MM" to minutes since midnight
function parseTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  return hours * 60 + minutes;
}

// Function to block and redirect to blocked page
function blockRequest(details) {
  if (isWithinFocusedHours()) {
    const redirectUrl = chrome.runtime.getURL(blockedPagePath);
    return { redirectUrl };
  } else {
    return {};
  }
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    updateSettings();
  }
});

updateSettings();
