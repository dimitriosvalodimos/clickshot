const STATE = "state";

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === "click_screenshot") {
    chrome.storage.local.get(STATE, ({ state }) => {
      if (!state || !state.recording) return;

      chrome.tabs.captureVisibleTab(null, { format: "png" }, (dataUrl) => {
        if (dataUrl) {
          chrome.storage.local.set({
            [STATE]: {
              ...state,
              screenshots: [...state.screenshots, dataUrl],
            },
          });
        }
      });
    });
  }
});
