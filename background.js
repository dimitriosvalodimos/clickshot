chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action !== "click_screenshot") return;

  chrome.storage.local.get("state", ({ state }) => {
    if (!state || !state.recording) return;

    chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
      if (!dataUrl) return;

      chrome.storage.local.set({
        state: {
          ...state,
          screenshots: [...state.screenshots, dataUrl],
        },
      });
    });
  });
});
