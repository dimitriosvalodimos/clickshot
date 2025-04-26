document.addEventListener(
  "mousedown",
  (e) => {
    if (e.button === 0) {
      chrome.storage.local.get("state", ({ state }) => {
        if (!state || !state.recording) return;
        chrome.runtime.sendMessage({ action: "click_screenshot" });
      });
    }
  },
  true,
);
