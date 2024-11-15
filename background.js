let blockedSites = [];
let focusedHours = { start: "", end: "" };

// Function to update blocked sites and focused hours
function updateSettings() {
  chrome.storage.sync.get(["blockedSites", "focusedHours"], async (data) => {
    blockedSites = data.blockedSites || [];
    focusedHours = data.focusedHours || { start: "", end: "" };

    // Schedule alarms based on focused hours
    scheduleAlarms();

    // Update rules based on current time
    await updateRules();
  });
}

// Function to schedule alarms
function scheduleAlarms() {
  // Clear existing alarms
  chrome.alarms.clearAll();

  if (focusedHours.start && focusedHours.end) {
    const startAlarmTime = getNextTime(focusedHours.start);
    const endAlarmTime = getNextTime(focusedHours.end);

    // Schedule start alarm
    chrome.alarms.create("startBlocking", { when: startAlarmTime.getTime() });

    // Schedule end alarm
    chrome.alarms.create("stopBlocking", { when: endAlarmTime.getTime() });
  }
}

// Function to calculate the next occurrence of a given time
function getNextTime(timeStr) {
  const [hours, minutes] = timeStr.split(":").map(Number);
  const now = new Date();
  const nextTime = new Date();

  nextTime.setHours(hours);
  nextTime.setMinutes(minutes);
  nextTime.setSeconds(0);
  nextTime.setMilliseconds(0);

  if (nextTime <= now) {
    // If the time has already passed today, schedule for tomorrow
    nextTime.setDate(nextTime.getDate() + 1);
  }

  return nextTime;
}

// Function to update dynamic rules
async function updateRules() {
  const isBlockingActive = await isWithinFocusedHours();

  // Clear existing dynamic rules
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const existingRuleIds = existingRules.map((rule) => rule.id);
  if (existingRuleIds.length > 0) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existingRuleIds,
    });
  }

  if (isBlockingActive && blockedSites.length > 0) {
    const rules = createBlockingRules(blockedSites);
    await chrome.declarativeNetRequest.updateDynamicRules({
      addRules: rules,
    });
  }
}

// Function to check if current time is within focused hours
async function isWithinFocusedHours() {
  if (!focusedHours.start || !focusedHours.end) {
    // If focused hours are not set, block all the time
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

// Function to create blocking rules based on blocked sites
function createBlockingRules(blockedSites) {
  const rules = [];
  let ruleId = 1;

  blockedSites.forEach((sitePattern) => {
    console.log("sitePattern", sitePattern);
    console.log(
      "sitePatternToUrlFilter(sitePattern)",
      sitePatternToUrlFilter(sitePattern)
    );
    const rule = {
      id: ruleId++,
      priority: 1,
      // action: {
      //   type: "block",
      // },
      action: { type: "redirect", redirect: { url: "https://example.com" } },
      condition: {
        urlFilter: sitePatternToUrlFilter(sitePattern),
        resourceTypes: ["main_frame"],
      },
    };
    rules.push(rule);
  });

  return rules;
}

function sitePatternToUrlFilter(sitePattern) {
  return sitePattern.replace(/^\*:\/\/\*\./, "").replace(/\/\*$/, "");
}

// Listen for alarms
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "startBlocking" || alarm.name === "stopBlocking") {
    updateRules();
    scheduleAlarms(); // Reschedule alarms for the next day
  }
});

// Listen for storage changes
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "sync") {
    updateSettings();
  }
});

// Initial load
updateSettings();
