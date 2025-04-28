function flashScreen() {
  const flash = document.createElement("div");
  flash.style.position = "fixed";
  flash.style.top = 0;
  flash.style.left = 0;
  flash.style.width = "100vw";
  flash.style.height = "100vh";
  flash.style.backgroundColor = "white";
  flash.style.opacity = "0.6";
  flash.style.zIndex = 99999;
  flash.style.pointerEvents = "none";
  flash.style.transition = "opacity 0.5s ease-out";

  document.body.appendChild(flash);

  setTimeout(() => {
    flash.style.opacity = "0";
    setTimeout(() => {
      flash.remove();
    }, 500);
  }, 100);
}

document.addEventListener(
  "mousedown",
  (e) => {
    if (e.button !== 0) return;
    chrome.runtime.sendMessage({ action: "click_screenshot" }, () => {
      chrome.storage.local.get("state", ({ state }) => {
        if (!state || !state.recording) return;
        flashScreen();
      });
    });
  },
  true,
);
