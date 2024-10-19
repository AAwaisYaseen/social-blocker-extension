// Initialize blocked sites
let blockedSites = [];

// Function to update blocked sites
function updateBlockedSites() {
  chrome.storage.sync.get(["blockedSites"], (data) => {
    blockedSites = data.blockedSites || [];

    // Remove previous listeners
    if (chrome.webRequest.onBeforeRequest.hasListener(blockRequest)) {
      chrome.webRequest.onBeforeRequest.removeListener(blockRequest);
    }

    // Add listener with updated blocked sites
    if (blockedSites.length > 0) {
      chrome.webRequest.onBeforeRequest.addListener(
        blockRequest,
        { urls: blockedSites },
        ["blocking"]
      );
    }
  });
}

// Function to block the request
function blockRequest(details) {
  return { cancel: true };
}

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync" && changes.blockedSites) {
    updateBlockedSites();
  }
});

// Initial load
updateBlockedSites();
