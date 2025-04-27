const startBtn = document.querySelector(".start");
const stopBtn = document.querySelector(".stop");
const filenameInput = document.getElementById("filename");
const counter = document.getElementById("counter");

class State {
  _state = { recording: false, filename: "", screenshots: [] };
  _requiredKeys = ["recording", "filename", "screenshots"];

  async init() {
    const { state: local } = await chrome.storage.local.get("state");

    if (
      !local ||
      typeof local !== "object" ||
      !this._requiredKeys.every((k) => k in local)
    ) {
      this.set({ recording: false, filename: "", screenshots: [] });
    } else {
      this.set(local);
    }
  }

  get recording() {
    return this._state.recording;
  }

  get filename() {
    return this._state.filename;
  }

  get screenshots() {
    return this._state.screenshots;
  }

  get len() {
    return this._state.screenshots.length;
  }

  get() {
    return this._state;
  }

  async set(...args) {
    // if args is an object with all needed properties, swap it in
    if (args.length === 1) {
      const [state] = args;
      if (
        !(
          state &&
          typeof state === "object" &&
          this._requiredKeys.every((k) => k in state) &&
          typeof state.recording === "boolean" &&
          typeof state.filename === "string" &&
          Array.isArray(state.screenshots)
        )
      ) {
        throw Error(
          `provided state: ${JSON.stringify(state)} not matching requirements`,
        );
      }
      this._state = state;
    }
    // if args is [string, unknown], swap the value in at the given property
    else if (args.length === 2) {
      const [property, value] = args;
      if (!this._requiredKeys.includes(property)) {
        throw Error(`unknown property ${property}`);
      }
      if (property === "recording" && typeof value === "boolean") {
        this._state.recording = value;
      } else if (property === "filename" && typeof value === "string") {
        this._state.filename = value;
      } else if (property === "screenshots" && Array.isArray(value)) {
        this._state.screenshots = value;
      } else {
        throw Error(`missmatched value type ${typeof value}`);
      }
    } else {
      throw Error(`too many args provided`);
    }
    await this._store();
  }

  async reset() {
    this._state = { recording: false, filename: "", screenshots: [] };
    await this._store();
  }

  async _store() {
    await chrome.storage.local.set({ state: this._state });
  }
}

const state = new State();

function update() {
  filenameInput.disabled = state.recording;
  if (state.recording) {
    startBtn.classList.add("disabled");
    stopBtn.classList.remove("disabled");
    counter.style.display = "block";
  } else {
    startBtn.classList.remove("disabled");
    stopBtn.classList.add("disabled");
    counter.style.display = "none";
  }

  counter.innerText = `Screenshots: ${state.len}`;
}

async function init() {
  await state.init();
  await state._store();

  if (state.filename) {
    filenameInput.value = state.filename;
  }

  update();
}

startBtn.addEventListener("click", async () => {
  const filename = filenameInput.value.trim().replaceAll(" ", "-");
  if (!filename) {
    alert("Please enter a filename before recording");
    return;
  }

  state.set({ recording: true, filename, screenshots: [] });
  chrome.runtime.sendMessage({ action: "start_recording" });
  update();
});

stopBtn.addEventListener("click", async () => {
  state.set("recording", false);
  chrome.runtime.sendMessage({ action: "stop_recording" });

  update();

  if (state.len === 0) return;

  const filename = state.filename || "clickshot";

  const zip = new JSZip();
  for (const [i, dataUrl] of state.screenshots.entries()) {
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

  await state.reset();
});

init();
