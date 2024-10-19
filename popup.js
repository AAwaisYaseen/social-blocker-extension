// Predefined sites with their URL patterns
const predefinedSites = {
  facebook: "*://*.facebook.com/*",
  instagram: "*://*.instagram.com/*",
  youtube: "*://*.youtube.com/*",
  twitter: "*://*.twitter.com/*",
  reddit: "*://*.reddit.com/*",
};

// DOM elements
const toggles = document.querySelectorAll('#toggles input[type="checkbox"]');
const updateButton = document.getElementById("updateButton");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");

// Load saved settings
function loadSettings() {
  chrome.storage.sync.get(["blockedSites"], (data) => {
    const blockedSites = data.blockedSites || [];

    // Set the toggle states
    toggles.forEach((toggle) => {
      toggle.checked = blockedSites.includes(predefinedSites[toggle.id]);
    });
  });
}

// Save settings when the Update button is clicked
updateButton.addEventListener("click", () => {
  const blockedSites = [];

  toggles.forEach((toggle) => {
    if (toggle.checked) {
      blockedSites.push(predefinedSites[toggle.id]);
    }
  });

  chrome.storage.sync.set({ blockedSites }, () => {
    console.log("Blocked sites done:", blockedSites);

    // Add click effect on the update button
    updateButton.textContent = "Done";
    updateButton.disabled = true;
    updateButton.classList.add("done");

    // Revert the button after a short delay
    setTimeout(() => {
      updateButton.textContent = "Update";
      updateButton.disabled = false;
      updateButton.classList.remove("done");
    }, 1500); // 2-second delay
  });
});

// Initial load
document.addEventListener("DOMContentLoaded", loadSettings);
