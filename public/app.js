const incoming = document.getElementById("incoming");
const styleInput = document.getElementById("style");
const makeButton = document.getElementById("make");
const copyButton = document.getElementById("copy");
const answerBox = document.getElementById("answer");
const errorBox = document.getElementById("error");
const historyList = document.getElementById("historyList");
const HISTORY_KEY = "shawon-ai-reply-history";
const MAX_HISTORY = 50;

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch((error) => {
      console.error("Service worker registration failed:", error);
    });
  });
}

function readHistory() {
  try {
    const items = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    return Array.isArray(items) ? items : [];
  } catch {
    return [];
  }
}

function saveHistory(items) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(items.slice(0, MAX_HISTORY)));
  } catch {
    errorBox.textContent = "ফোনের স্টোরেজে জায়গা না থাকায় History সেভ করা যায়নি।";
  }
}

function renderHistory() {
  const items = readHistory();
  historyList.replaceChildren();

  if (!items.length) {
    const empty = document.createElement("p");
    empty.className = "history-empty";
    empty.textContent = "এখনো কোনো উত্তর সেভ হয়নি।";
    historyList.appendChild(empty);
    return;
  }

  items.forEach((item) => {
    const card = document.createElement("article");
    card.className = "history-item";

    const heading = document.createElement("div");
    heading.className = "history-item-head";

    const info = document.createElement("div");
    info.className = "history-info";
    const title = document.createElement("strong");
    title.textContent = item.message.length > 55 ? item.message.slice(0, 55) + "…" : item.message;
    const date = document.createElement("small");
    date.textContent = new Date(item.createdAt).toLocaleString("bn-BD");
    info.append(title, date);

    const actions = document.createElement("div");
    actions.className = "history-actions";
    const view = document.createElement("button");
    view.type = "button";
    view.className = "history-view";
    view.textContent = "দেখুন";
    view.addEventListener("click", () => {
      answerBox.textContent = item.answer;
      incoming.value = item.message;
      styleInput.value = item.style || "";
      copyButton.disabled = false;
      document.querySelector(".result").scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "history-delete";
    remove.textContent = "মুছুন";
    remove.addEventListener("click", () => {
      saveHistory(readHistory().filter((entry) => entry.id !== item.id));
      renderHistory();
    });
    actions.append(view, remove);
    heading.append(info, actions);

    const preview = document.createElement("p");
    preview.className = "history-preview";
    preview.textContent = item.answer.length > 110 ? item.answer.slice(0, 110) + "…" : item.answer;
    card.append(heading, preview);
    historyList.appendChild(card);
  });
}

function addToHistory(message, style, answer) {
  const items = readHistory();
  items.unshift({
    id: Date.now().toString() + Math.random().toString(36).slice(2, 7),
    message,
    style,
    answer,
    createdAt: new Date().toISOString()
  });
  saveHistory(items);
  renderHistory();
}

document.getElementById("clearHistory").addEventListener("click", () => {
  if (!readHistory().length) return;
  if (confirm("সব History মুছে ফেলতে চাও?")) {
    localStorage.removeItem(HISTORY_KEY);
    renderHistory();
  }
});

renderHistory();

makeButton.addEventListener("click", async () => {
  const message = incoming.value.trim();
  const style = styleInput.value.trim();
  errorBox.textContent = "";
  if (!message) {
    errorBox.textContent = "আগে মেসেজটি লিখুন বা পেস্ট করুন।";
    incoming.focus();
    return;
  }

  makeButton.disabled = true;
  makeButton.textContent = "উত্তর তৈরি হচ্ছে...";
  copyButton.disabled = true;
  answerBox.textContent = "একটু অপেক্ষা করো...";
  try {
    const response = await fetch("/api/reply", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, style })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "উত্তর তৈরি করা যায়নি।");
    answerBox.textContent = data.answer;
    copyButton.disabled = false;
    addToHistory(message, style, data.answer);
  } catch (error) {
    answerBox.textContent = "এখনো উত্তর তৈরি হয়নি।";
    errorBox.textContent = error.message || "ইন্টারনেট বা সার্ভারে সমস্যা হয়েছে।";
  } finally {
    makeButton.disabled = false;
    makeButton.textContent = "উত্তরের খসড়া তৈরি করো";
  }
});

copyButton.addEventListener("click", async () => {
  const text = answerBox.textContent.trim();
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    copyButton.textContent = "কপি হয়েছে";
    setTimeout(() => { copyButton.textContent = "কপি"; }, 1600);
  } catch {
    errorBox.textContent = "কপি করা যায়নি। লেখাটি চেপে ধরে কপি করো।";
  }
});
