// ─── Constants ───────────────────────────────────────────────────────────────
const DEFAULT_API_URL = "https://lifeos-web-production.up.railway.app";

// ─── State ────────────────────────────────────────────────────────────────────
let currentTab = null;
let urlIncluded = false;
let isListening = false;
let recognition = null;
let cfg = { apiUrl: DEFAULT_API_URL, apiKey: "" };

// ─── Screens ──────────────────────────────────────────────────────────────────
const screenLoading = document.getElementById("screenLoading");
const screenSignIn  = document.getElementById("screenSignIn");
const screenCapture = document.getElementById("screenCapture");

function showScreen(id) {
  [screenLoading, screenSignIn, screenCapture].forEach((s) => (s.style.display = "none"));
  document.getElementById(id).style.display = "block";

  // Show settings gear only in capture screen
  document.getElementById("btnSettings").style.display =
    id === "screenCapture" ? "flex" : "none";
}

// ─── DOM refs (capture screen) ────────────────────────────────────────────────
const urlChip        = document.getElementById("urlChip");
const urlText        = document.getElementById("urlText");
const chipRemove     = document.getElementById("chipRemove");
const textarea       = document.getElementById("textarea");
const btnDictate     = document.getElementById("btnDictate");
const dictateLabel   = document.getElementById("dictateLabel");
const btnCapture     = document.getElementById("btnCapture");
const statusEl       = document.getElementById("status");
const settingsHeader = document.getElementById("settingsHeader");
const settingsBody   = document.getElementById("settingsBody");
const settingsChevron= document.getElementById("settingsChevron");
const apiUrlInput    = document.getElementById("apiUrlInput");
const apiKeyInput    = document.getElementById("apiKeyInput");
const btnSave        = document.getElementById("btnSave");
const connDot        = document.getElementById("connDot");
const connText       = document.getElementById("connText");

// ─── DOM refs (sign-in screen) ────────────────────────────────────────────────
const btnSignIn            = document.getElementById("btnSignIn");
const signinHint           = document.getElementById("signinHint");
const btnSignInSettings    = document.getElementById("btnSignInSettings");
const signinSettingsPanel  = document.getElementById("signinSettingsPanel");
const signinApiUrl         = document.getElementById("signinApiUrl");
const btnSaveSigninSettings= document.getElementById("btnSaveSigninSettings");

// ─── Init ─────────────────────────────────────────────────────────────────────
async function init() {
  showScreen("screenLoading");

  // Load settings
  const stored = await chrome.storage.sync.get(["apiUrl", "apiKey"]);
  cfg.apiUrl = stored.apiUrl || DEFAULT_API_URL;
  cfg.apiKey  = stored.apiKey || "";
  apiUrlInput.value   = cfg.apiUrl;
  apiKeyInput.value   = cfg.apiKey;
  signinApiUrl.value  = cfg.apiUrl;

  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;

  // Check auth
  const authed = await checkAuth();
  if (!authed) {
    showScreen("screenSignIn");
    return;
  }

  showScreen("screenCapture");
  setupCaptureScreen();
}

// ─── Auth check ───────────────────────────────────────────────────────────────
async function checkAuth() {
  try {
    const headers = buildHeaders();
    const res = await fetch(`${cfg.apiUrl}/api/whoami`, {
      headers,
      credentials: "include",
      signal: AbortSignal.timeout(5000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

function buildHeaders() {
  const h = { "Content-Type": "application/json" };
  if (cfg.apiKey) h["Authorization"] = `Bearer ${cfg.apiKey}`;
  return h;
}

// ─── Capture screen setup ─────────────────────────────────────────────────────
function setupCaptureScreen() {
  const isWebPage =
    currentTab?.url &&
    !currentTab.url.startsWith("chrome://") &&
    !currentTab.url.startsWith("chrome-extension://") &&
    !currentTab.url.startsWith("about:");

  if (isWebPage) {
    try {
      const u = new URL(currentTab.url);
      const host = u.hostname.replace(/^www\./, "");
      const title = currentTab.title || "";
      const titleSnip = title.length > 42 ? title.slice(0, 39) + "…" : title;
      urlText.textContent = titleSnip ? `${host} — ${titleSnip}` : host;
      urlText.title = currentTab.url;
      urlChip.classList.add("visible");
      urlIncluded = true;
    } catch (_) {}
  }

  // Connection status in settings
  updateConnStatus();

  // Focus textarea
  setTimeout(() => textarea.focus(), 50);
}

async function updateConnStatus() {
  connDot.className = "conn-dot";
  connText.textContent = "Checking…";
  const ok = await checkAuth();
  connDot.className = `conn-dot ${ok ? "ok" : "err"}`;
  connText.textContent = ok ? "Connected" : "Not connected";
}

// ─── Sign-in screen ───────────────────────────────────────────────────────────
btnSignIn.addEventListener("click", () => {
  // Open the LifeOS sign-in page in a new tab
  chrome.tabs.create({ url: `${cfg.apiUrl}/sign-in` });
  signinHint.style.display = "block";
});

// Small settings panel inside sign-in screen (for URL config only)
btnSignInSettings.addEventListener("click", () => {
  const open = signinSettingsPanel.style.display === "none";
  signinSettingsPanel.style.display = open ? "block" : "none";
  btnSignInSettings.textContent = open ? "Hide" : "Configure API URL";
});

btnSaveSigninSettings.addEventListener("click", async () => {
  cfg.apiUrl = signinApiUrl.value.trim() || DEFAULT_API_URL;
  apiUrlInput.value = cfg.apiUrl;
  signinApiUrl.value = cfg.apiUrl;
  await chrome.storage.sync.set({ apiUrl: cfg.apiUrl });
  // Re-check auth with new URL
  const authed = await checkAuth();
  if (authed) {
    showScreen("screenCapture");
    setupCaptureScreen();
  } else {
    signinHint.textContent = "Still not signed in. Open the website and sign in first.";
    signinHint.style.display = "block";
  }
});

// ─── Capture: URL chip ────────────────────────────────────────────────────────
chipRemove.addEventListener("click", () => {
  urlIncluded = false;
  urlChip.classList.remove("visible");
  textarea.focus();
});

// ─── Capture: Voice dictation ─────────────────────────────────────────────────
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

btnDictate.addEventListener("click", () => {
  isListening ? stopDictation() : startDictation();
});

function startDictation() {
  if (!SR) {
    showStatus("Voice input is not supported in this browser.", "error");
    return;
  }

  recognition = new SR();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = "en-US";

  let committedText = textarea.value;

  recognition.onresult = (event) => {
    let interim = "";
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const chunk = event.results[i][0].transcript;
      if (event.results[i].isFinal) {
        committedText +=
          (committedText.length && !committedText.endsWith(" ") ? " " : "") +
          chunk.trim();
        interim = "";
      } else {
        interim = chunk;
      }
    }
    const spacer =
      committedText.length && !committedText.endsWith(" ") ? " " : "";
    textarea.value = committedText + (interim ? spacer + interim : "");
    textarea.selectionStart = textarea.selectionEnd = textarea.value.length;
  };

  recognition.onerror = (e) => {
    if (e.error !== "no-speech" && e.error !== "aborted") {
      showStatus(`Voice error: ${e.error}`, "error");
      stopDictation();
    }
  };

  recognition.onend = () => {
    if (isListening) {
      try { recognition.start(); } catch (_) {}
    }
  };

  try {
    recognition.start();
    isListening = true;
    btnDictate.classList.add("active");
    dictateLabel.textContent = "Stop";
    textarea.classList.add("listening");
    textarea.placeholder = "Listening…";
  } catch {
    showStatus("Could not start voice input.", "error");
    isListening = false;
  }
}

function stopDictation() {
  isListening = false;
  if (recognition) {
    try { recognition.stop(); } catch (_) {}
    recognition = null;
  }
  btnDictate.classList.remove("active");
  dictateLabel.textContent = "Dictate";
  textarea.classList.remove("listening");
  textarea.placeholder = "What's on your mind…\n\nUse #tags · ⌘↩ to capture";
}

// ─── Capture: Submit ──────────────────────────────────────────────────────────
btnCapture.addEventListener("click", capture);

textarea.addEventListener("keydown", (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
    e.preventDefault();
    capture();
  }
});

async function capture() {
  const raw = textarea.value.trim();
  if (!raw) { textarea.focus(); return; }

  if (isListening) stopDictation();

  let content = raw;
  if (urlIncluded && currentTab?.url) {
    content += `\n\n🔗 ${currentTab.url}`;
  }

  btnCapture.disabled = true;
  btnCapture.textContent = "Capturing…";

  try {
    const res = await fetch(`${cfg.apiUrl}/api/inkwell`, {
      method: "POST",
      headers: buildHeaders(),
      credentials: "include",
      body: JSON.stringify({ content }),
    });

    if (res.ok) {
      showStatus("Captured ✓", "success");
      textarea.value = "";
      if (currentTab?.url && urlText.textContent) {
        urlIncluded = true;
        urlChip.classList.add("visible");
      }
      setTimeout(() => window.close(), 1200);
    } else if (res.status === 401) {
      // Session may have expired — send back to sign-in
      showScreen("screenSignIn");
    } else {
      const data = await res.json().catch(() => ({}));
      showStatus(data.error || "Capture failed. Try again.", "error");
    }
  } catch {
    showStatus("Network error — is LifeOS reachable?", "error");
  } finally {
    btnCapture.disabled = false;
    btnCapture.textContent = "Capture →";
  }
}

// ─── Capture: Settings ────────────────────────────────────────────────────────
document.getElementById("btnSettings").addEventListener("click", () => {
  const open = settingsBody.classList.toggle("open");
  settingsChevron.classList.toggle("open", open);
});

settingsHeader.addEventListener("click", () => {
  const open = settingsBody.classList.toggle("open");
  settingsChevron.classList.toggle("open", open);
});

btnSave.addEventListener("click", async () => {
  cfg.apiUrl = apiUrlInput.value.trim() || DEFAULT_API_URL;
  cfg.apiKey  = apiKeyInput.value.trim();
  signinApiUrl.value = cfg.apiUrl;
  await chrome.storage.sync.set({ apiUrl: cfg.apiUrl, apiKey: cfg.apiKey });
  showStatus("Settings saved", "success");
  updateConnStatus();
});

// ─── Helpers ──────────────────────────────────────────────────────────────────
let statusTimer = null;

function showStatus(msg, type) {
  clearTimeout(statusTimer);
  statusEl.textContent = msg;
  statusEl.className = `status ${type} show`;
  statusTimer = setTimeout(() => { statusEl.className = "status"; }, 3500);
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();
