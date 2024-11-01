const predefinedSites = {
  facebook: "*://*.facebook.com/*",
  instagram: "*://*.instagram.com/*",
  youtube: "*://*.youtube.com/*",
  twitter: "*://*.twitter.com/*",
  reddit: "*://*.reddit.com/*",
};

const toggles = document.querySelectorAll('#toggles input[type="checkbox"]');
const applyButton = document.getElementById("applyButton");
const startTimeInput = document.getElementById("startTime");
const endTimeInput = document.getElementById("endTime");

function isValidTime(timeStr) {
  return /^([0-1]\d|2[0-3]):([0-5]\d)$/.test(timeStr);
}

function loadSettings() {
  chrome.storage.sync.get(["blockedSites", "focusedHours"], (data) => {
    const blockedSites = data.blockedSites || [];
    const focusedHours = data.focusedHours || { start: "", end: "" };

    toggles.forEach((toggle) => {
      toggle.checked = blockedSites.includes(predefinedSites[toggle.id]);
    });

    startTimeInput.value = focusedHours.start;
    endTimeInput.value = focusedHours.end;
  });
}

applyButton.addEventListener("click", () => {
  const blockedSites = [];
  const startTime = startTimeInput.value;
  const endTime = endTimeInput.value;

  if (!isValidTime(startTime) || !isValidTime(endTime)) {
    alert("Please enter valid times in HH:MM format.");
    return;
  }

  toggles.forEach((toggle) => {
    if (toggle.checked) {
      blockedSites.push(predefinedSites[toggle.id]);
    }
  });

  const focusedHours = {
    start: startTime,
    end: endTime,
  };

  chrome.storage.sync.set({ blockedSites, focusedHours }, () => {
    console.log("Settings updated:", { blockedSites, focusedHours });

    applyButton.textContent = "Done";
    applyButton.disabled = true;
    applyButton.classList.add("done");

    setTimeout(() => {
      applyButton.textContent = "Apply";
      applyButton.disabled = false;
      applyButton.classList.remove("done");
    }, 500);
  });
});

document.addEventListener("DOMContentLoaded", loadSettings);
