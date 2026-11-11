const incoming = document.getElementById("incoming");
const styleInput = document.getElementById("style");
const makeButton = document.getElementById("make");
const copyButton = document.getElementById("copy");
const answerBox = document.getElementById("answer");
const errorBox = document.getElementById("error");

makeButton.addEventListener("click", async () => {
  const message = incoming.value.trim();
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
      body: JSON.stringify({ message, style: styleInput.value.trim() })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "উত্তর তৈরি করা যায়নি।");
    answerBox.textContent = data.answer;
    copyButton.disabled = false;
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
