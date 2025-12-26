/* ============================================================
   SHARED UTILITIES
   ============================================================ */

function copyToClipboard(text) {
  if (!text) return;
  navigator.clipboard.writeText(text).catch(() => {});
}

function getRandomChar(str) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return str[array[0] % str.length];
}

function randomItem(arr) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return arr[array[0] % arr.length];
}

function randomNumber(min, max) {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return min + (array[0] % (max - min + 1));
}

function shareCurrentTool() {
  copyToClipboard(window.location.href);
}

/* ============================================================
   PASSWORD GENERATOR
   ============================================================ */

function initPasswordGenerator() {
  const output = document.getElementById("pg-output");
  const lengthInput = document.getElementById("pg-length");
  const lowercase = document.getElementById("pg-lowercase");
  const uppercase = document.getElementById("pg-uppercase");
  const numbers = document.getElementById("pg-numbers");
  const symbols = document.getElementById("pg-symbols");
  const generateBtn = document.getElementById("pg-generate");
  const copyBtn = document.getElementById("pg-copy");
  const shareBtn = document.getElementById("pg-share");

  if (!output || !lengthInput || !generateBtn) return;

  const LOWER = "abcdefghijklmnopqrstuvwxyz";
  const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const NUM = "0123456789";
  const SYM = "!@#$%^&*()-_=+[]{};:,.<>/?";

  function generate() {
    let charset = "";
    const pools = [];

    if (lowercase.checked) { charset += LOWER; pools.push(LOWER); }
    if (uppercase.checked) { charset += UPPER; pools.push(UPPER); }
    if (numbers.checked)   { charset += NUM;   pools.push(NUM); }
    if (symbols.checked)   { charset += SYM;   pools.push(SYM); }

    if (!charset) {
      output.value = "";
      return;
    }

    const length = parseInt(lengthInput.value, 10);
    const chars = [];

    pools.forEach(pool => chars.push(getRandomChar(pool)));

    while (chars.length < length) {
      chars.push(getRandomChar(charset));
    }

    for (let i = chars.length - 1; i > 0; i--) {
      const j = randomNumber(0, i);
      [chars[i], chars[j]] = [chars[j], chars[i]];
    }

    output.value = chars.join("");
  }

  generateBtn.addEventListener("click", generate);
  generate();

  if (copyBtn) copyBtn.addEventListener("click", () => copyToClipboard(output.value));
  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}

/* ============================================================
   PASSWORD STRENGTH CHECKER
   ============================================================ */

function initStrengthChecker() {
  const input = document.getElementById("psc-input");
  const bar = document.getElementById("psc-bar");
  const label = document.getElementById("psc-label");
  const advice = document.getElementById("psc-advice");
  const shareBtn = document.getElementById("psc-share");

  if (!input || !bar || !label) return;

  function update() {
    const pwd = input.value;

    if (!pwd) {
      bar.style.width = "0%";
      bar.style.background = "#d1d5db";
      label.textContent = "Strength: –";
      advice.textContent = "";
      return;
    }

    let score = 0;
    const length = pwd.length;
    const hasLower = /[a-z]/.test(pwd);
    const hasUpper = /[A-Z]/.test(pwd);
    const hasNum = /\d/.test(pwd);
    const hasSym = /[^A-Za-z0-9]/.test(pwd);

    if (length >= 8) score++;
    if (length >= 12) score++;
    if (length >= 16) score++;
    if (hasLower + hasUpper + hasNum + hasSym >= 2) score++;
    if (hasLower + hasUpper + hasNum + hasSym >= 3) score++;

    const levels = [
      { label: "Very weak", color: "#ef4444", width: 20 },
      { label: "Weak",      color: "#f59e0b", width: 40 },
      { label: "Okay",      color: "#eab308", width: 60 },
      { label: "Strong",    color: "#22c55e", width: 80 },
      { label: "Very strong", color: "#16a34a", width: 100 }
    ];

    const level = levels[Math.min(score, 4)];

    bar.style.width = level.width + "%";
    bar.style.background = level.color;
    label.textContent = "Strength: " + level.label;

    let tips = [];
    if (length < 12) tips.push("Use at least 12 characters.");
    if (!(hasLower && hasUpper)) tips.push("Mix upper and lowercase letters.");
    if (!hasNum) tips.push("Add a number.");
    if (!hasSym) tips.push("Add a symbol.");

    advice.textContent = tips.join(" ");
  }

  input.addEventListener("input", update);
  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}

/* ============================================================
   USERNAME GENERATOR
   ============================================================ */

function initUsernameGenerator() {
  const keywordInput = document.getElementById("ug-keyword");
  const styleSelect = document.getElementById("ug-style");
  const countSelect = document.getElementById("ug-count");
  const generateBtn = document.getElementById("ug-generate");
  const resultsList = document.getElementById("ug-results");
  const shareBtn = document.getElementById("ug-share");

  if (!keywordInput || !styleSelect || !generateBtn || !resultsList) return;

  const baseWords = [
    "pixel", "raven", "nova", "sol", "ember", "echo",
    "zen", "orbit", "shadow", "lumen", "flux", "vortex"
  ];

  function generateUsername(keyword, style) {
    let base = keyword || randomItem(baseWords);

    if (style === "gamer") return base + randomNumber(10, 9999);
    if (style === "aesthetic") return `${randomItem(["soft","dusty","midnight","cloudy","mossy"])}_${base}`;

    return base + randomNumber(1, 999);
  }

  function generate() {
    const keyword = keywordInput.value.trim().toLowerCase();
    const style = styleSelect.value;
    const count = parseInt(countSelect.value, 10);

    resultsList.innerHTML = "";

    for (let i = 0; i < count; i++) {
      const name = generateUsername(keyword, style);
      const li = document.createElement("li");
      li.textContent = name;
      resultsList.appendChild(li);
    }
  }

  generateBtn.addEventListener("click", generate);
  generate();

  resultsList.addEventListener("click", (e) => {
    if (e.target.tagName === "LI") copyToClipboard(e.target.textContent);
  });

  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}

/* ============================================================
   PASSPHRASE GENERATOR
   ============================================================ */

function initPassphraseGenerator() {
  const countSelect = document.getElementById("pp-count");
  const hyphens = document.getElementById("pp-hyphens");
  const output = document.getElementById("pp-output");
  const generateBtn = document.getElementById("pp-generate");
  const copyBtn = document.getElementById("pp-copy");
  const shareBtn = document.getElementById("pp-share");

  if (!countSelect || !output || !generateBtn) return;

  const wordList = [
    "solar","river","stone","ember","forest","crystal","shadow","lunar",
    "silent","ocean","meadow","thunder","velvet","cinder","raven","echo",
    "frost","willow","storm","harbor","canyon","breeze","summit","hollow"
  ];

  function generate() {
    const count = parseInt(countSelect.value, 10);
    const useHyphens = hyphens.checked;

    const words = [];
    for (let i = 0; i < count; i++) words.push(randomItem(wordList));

    output.value = useHyphens ? words.join("-") : words.join(" ");
  }

  generateBtn.addEventListener("click", generate);
  generate();

  if (copyBtn) copyBtn.addEventListener("click", () => copyToClipboard(output.value));
  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}

/* ============================================================
   SECURE KEY GENERATOR
   ============================================================ */

function initKeyGenerator() {
  const formatSelect = document.getElementById("kg-format");
  const lengthSelect = document.getElementById("kg-length");
  const customLengthInput = document.getElementById("kg-custom-length");
  const output = document.getElementById("kg-output");
  const generateBtn = document.getElementById("kg-generate");
  const copyBtn = document.getElementById("kg-copy");
  const shareBtn = document.getElementById("kg-share");

  if (!formatSelect || !lengthSelect || !output) return;

  lengthSelect.addEventListener("change", () => {
    customLengthInput.style.display =
      lengthSelect.value === "custom" ? "block" : "none";
  });

  function generateKey() {
    let length =
      lengthSelect.value === "custom"
        ? parseInt(customLengthInput.value, 10)
        : parseInt(lengthSelect.value, 10);

    if (!length || length < 8) {
      output.value = "";
      return;
    }

    const format = formatSelect.value;

    let bytes = new Uint8Array(length);
    crypto.getRandomValues(bytes);

    let key = "";

    if (format === "hex") {
      key = Array.from(bytes)
        .map(b => b.toString(16).padStart(2, "0"))
        .join("")
        .slice(0, length);
    }

    if (format === "base64") {
      key = btoa(String.fromCharCode(...bytes)).slice(0, length);
    }

    if (format === "alphanumeric") {
      const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
      key = Array.from(bytes)
        .map(b => chars[b % chars.length])
        .join("")
        .slice(0, length);
    }

    output.value = key;
  }

  generateBtn.addEventListener("click", generateKey);

  if (copyBtn) copyBtn.addEventListener("click", () => copyToClipboard(output.value));
  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}

/* ============================================================
   QR CODE GENERATOR (Corrected)
   ============================================================ */

function initQrCodeGenerator() {
  const contentInput = document.getElementById("qr-content");
  const sizeSelect = document.getElementById("qr-size");
  const generateBtn = document.getElementById("qr-generate");
  const downloadBtn = document.getElementById("qr-download");
  const shareBtn = document.getElementById("qr-share");
  const previewEl = document.getElementById("qr-preview");
  const hintEl = document.getElementById("qr-hint");

  if (!contentInput || !sizeSelect || !generateBtn || !previewEl) return;

  let qr = null;

  function generateQr() {
    const text = contentInput.value.trim();
    const size = parseInt(sizeSelect.value, 10);

    if (!text) {
      previewEl.innerHTML = "";
      if (hintEl) hintEl.textContent = "Enter text above and click Generate.";
      return;
    }

    previewEl.innerHTML = "";

    qr = new QRCode(previewEl, {
      text,
      width: size,
      height: size,
      colorDark: "#ffffff",
      colorLight: "#1f1f23",
      correctLevel: QRCode.CorrectLevel.H
    });

    if (hintEl) hintEl.textContent = "Right-click to save or use Download PNG.";
  }

  generateBtn.addEventListener("click", generateQr);

  downloadBtn.addEventListener("click", () => {
    if (!qr) generateQr();

    const img = previewEl.querySelector("img") || previewEl.querySelector("canvas");
    if (!img) return;

    const dataUrl = img.tagName === "CANVAS"
      ? img.toDataURL("image/png")
      : img.src;

    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = "qrcode.png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  });

  if (shareBtn) shareBtn.addEventListener("click", shareCurrentTool);
}


/* ============================================================
   THEME SYSTEM — Light / Dark / Auto + FAB + Smooth Fade
   ============================================================ */

function applyTheme(mode) {
  if (mode === "dark") {
    document.documentElement.classList.add("dark-mode");
  } else if (mode === "light") {
    document.documentElement.classList.remove("dark-mode");
  } else {
    // Auto mode
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    document.documentElement.classList.toggle("dark-mode", prefersDark);
  }

  updateThemeIcons(document.documentElement.classList.contains("dark-mode"));
}

function updateThemeIcons(isDark) {
  const btn = document.getElementById("theme-toggle");
  const fab = document.getElementById("theme-fab");

  if (btn) btn.textContent = isDark ? "☀️ Light" : "🌙 Dark";
  if (fab) fab.textContent = isDark ? "☀️" : "🌙";
}

function initThemeToggle() {
  const toggleBtn = document.getElementById("theme-toggle");
  const fab = document.getElementById("theme-fab");

  const saved = localStorage.getItem("theme") || "auto";
  applyTheme(saved);

  // Desktop button
  if (toggleBtn) {
    toggleBtn.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeIcons(isDark);
    });
  }

  // Mobile FAB
  if (fab) {
    fab.addEventListener("click", () => {
      const isDark = document.documentElement.classList.toggle("dark-mode");
      localStorage.setItem("theme", isDark ? "dark" : "light");
      updateThemeIcons(isDark);
    });
  }

  // Auto mode reacts to system changes
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    if (localStorage.getItem("theme") === "auto") {
      applyTheme("auto");
    }
  });

  // Enable smooth transitions AFTER load
  setTimeout(() => {
    document.documentElement.classList.add("theme-ready");
  }, 50);
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1800);
}

// Universal copy feedback
document.querySelectorAll("[id$='-copy']").forEach(btn => {
  btn.addEventListener("click", () => showToast("Copied!"));
});

// Universal share feedback
document.querySelectorAll("[id$='-share']").forEach(btn => {
  btn.addEventListener("click", () => showToast("Link ready to share!"));
});



/* ============================================================
   OTHER TOOL INITIALIZERS (unchanged)
   ============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  initThemeToggle();
  initPasswordGenerator?.();
  initStrengthChecker?.();
  initUsernameGenerator?.();
  initPassphraseGenerator?.();
  initKeyGenerator?.();
  initQrCodeGenerator?.();
});


