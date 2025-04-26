const STATE = "state";

const startBtn = document.getElementById("start");
const stopBtn = document.getElementById("stop");
const filenameInput = document.getElementById("filename");
const counter = document.getElementById("counter");

function update(recording) {
  if (recording) {
    filenameInput.disabled = true;
    startBtn.style.display = "none";
    stopBtn.style.display = "block";
    counter.style.display = "block";
  } else {
    filenameInput.disabled = false;
    startBtn.style.display = "block";
    stopBtn.style.display = "none";
    counter.style.display = "none";
  }
}

async function init() {
  let { state } = await chrome.storage.local.get(STATE);

  if (
    !(
      state &&
      typeof state?.recording === "boolean" &&
      typeof state?.filename === "string" &&
      Array.isArray(state?.screenshots)
    )
  ) {
    state = {
      recording: false,
      filename: "",
      screenshots: [],
    };
    await chrome.storage.local.set({ [STATE]: state });
  }

  if (state.filename) {
    filenameInput.value = state.filename;
  }

  update(state.recording);

  counter.innerText = `Screenshots: ${state?.screenshots?.length ?? 0}`;
}

startBtn.addEventListener("click", async () => {
  const filename = filenameInput.value.trim().replaceAll(" ", "-");
  if (!filename) {
    alert("Please enter a filename before recording");
    return;
  }

  await chrome.storage.local.set({
    [STATE]: { recording: true, filename, screenshots: [] },
  });
  chrome.runtime.sendMessage({ action: "start_recording" });
  update(true);
});

stopBtn.addEventListener("click", async () => {
  const { state: oldState } = await chrome.storage.local.get(STATE);
  await chrome.storage.local.set({
    [STATE]: { ...oldState, recording: false },
  });
  chrome.runtime.sendMessage({ action: "stop_recording" });

  update(false);

  if (oldState.screenshots.length === 0) {
    alert("No screenshots to zip!");
    return;
  }

  const { state: newState } = await chrome.storage.local.get(STATE);
  const filename = newState.filename || "clickshot";

  const zip = new JSZip();
  for (const [i, dataUrl] of newState.screenshots.entries()) {
    const base64Data = dataUrl.split(",")[1];
    zip.file(`${filename}-${i + 1}.png`, base64Data, { base64: true });
  }

  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);

  chrome.downloads.download({
    url,
    filename: `${filename}.zip`,
    saveAs: false,
  });

  await chrome.storage.local.set({
    [STATE]: { recording: false, filename: "", screenshots: [] },
  });
});

init();
