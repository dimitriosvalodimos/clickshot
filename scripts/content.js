document.addEventListener(
  "mousedown",
  (e) => {
    if (e.button !== 0) return;
    chrome.runtime.sendMessage({ action: "click_screenshot" });
  },
  true,
);
