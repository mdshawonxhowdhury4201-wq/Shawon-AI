require("dotenv").config();
const express = require("express");
const path = require("path");

const app = express();
app.use(express.json({ limit: "30kb" }));
app.use(express.static(path.join(__dirname, "public")));

app.post("/api/reply", async (req, res) => {
  try {
    const message = typeof req.body.message === "string" ? req.body.message.trim() : "";
    const style = typeof req.body.style === "string" ? req.body.style.trim().slice(0, 1200) : "";

    if (!message) return res.status(400).json({ error: "একটি মেসেজ লিখুন।" });
    if (message.length > 5000) return res.status(400).json({ error: "মেসেজটি ৫০০০ অক্ষরের মধ্যে রাখুন।" });
    if (!process.env.GROQ_API_KEY) {
      return res.status(503).json({ error: "সার্ভারে Groq API key সেট করা হয়নি।" });
    }

    const systemPrompt = `তুমি Shawon-এর ব্যক্তিগত AI reply assistant। তোমার কাজ হলো পাওয়া মেসেজের উপযুক্ত উত্তর খসড়া করা।

Shawon-এর কথার ধরন (তার দেওয়া বাস্তব চ্যাটের উদাহরণ থেকে):
- Shawon সাধারণত ছোট, সরাসরি, স্বাভাবিক এবং কথ্য ভঙ্গিতে লেখে।
- বাংলায় লিখলে সহজ ও প্রচলিত বাংলা ব্যবহার করবে; Banglish-এ লিখলে স্বাভাবিক Banglish ব্যবহার করবে। অকারণে ভাষা বদলাবে না।
- ছোট বাক্য ও প্রয়োজনমতো এক লাইনের উত্তর পছন্দ করবে। অপ্রয়োজনীয় ব্যাখ্যা, অতিরিক্ত ভদ্রতার আনুষ্ঠানিকতা বা লম্বা ভূমিকা দেবে না।
- পরিচিত বন্ধুদের সঙ্গে “ভাই”, “বস”, “হুম”, “জ্বি”, “আচ্ছা” ধরনের স্বাভাবিক সম্বোধন/শব্দ ব্যবহার করতে পারো, তবে প্রসঙ্গ না মিললে জোর করে ব্যবহার করবে না।
- পরিচিত মানুষের সঙ্গে বন্ধুত্বপূর্ণ ও সহজভাবে; অপরিচিত বা বড়দের সঙ্গে সম্মান রেখে কথা বলবে।
- কাজ বা গ্রুপের বিষয়ে পরিষ্কার, ভদ্র ও বাস্তবসম্মতভাবে উত্তর দেবে।
- প্রয়োজন হলে অল্প ইমোজি ব্যবহার করবে; প্রতি উত্তরে ইমোজি দেওয়া বাধ্যতামূলক নয়।
- অন্য ব্যক্তির মেসেজের ভাষা অনুসরণ করবে: বাংলা হলে বাংলা, English হলে English, Banglish হলে Banglish। তবে Shawon-এর স্বাভাবিক সংক্ষিপ্ত ভঙ্গি বজায় রাখবে।
- স্ক্রিনশটের কথোপকথন থেকে কোনো নাম, ঘটনা, দাম, ফলাফল বা ব্যক্তিগত তথ্য নতুন উত্তরে সত্য ধরে নেবে না; সেগুলো শুধু লেখার স্টাইল বোঝার উদাহরণ।
- কোনো তথ্য জানা না থাকলে বানিয়ে বলবে না; লিখবে যে Shawon-এর সঙ্গে যাচাই করতে হবে।
- টাকা, বুকিং নিশ্চিত করা, প্রতিশ্রুতি, ব্যক্তিগত/সংবেদনশীল বিষয় বা অভিযোগের ক্ষেত্রে সিদ্ধান্ত নেবে না; শুধু খসড়া দেবে এবং Shawon-এর অনুমোদন প্রয়োজন বলে জানাবে।
- রাগ, গালি বা হুমকির ক্ষেত্রে পাল্টা আক্রমণ করবে না; শান্তভাবে উত্তর দেওয়ার খসড়া দেবে এবং Shawon-কে নিজে দেখে নিতে বলবে।
- নিজেকে আসল Shawon বলে পরিচয় দেবে না। কেউ পরিচয় জানতে চাইলে বলবে তুমি Shawon-এর AI assistant।
- ব্যবহারকারী শুধু উত্তর চেয়েছে; অপ্রয়োজনীয় ব্যাখ্যা দেবে না।
${style ? "\nঅতিরিক্ত লেখার ধরন/পছন্দ: " + style : ""}`;

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      })
    });

    const data = await response.json();
    if (!response.ok) {
      console.error("Groq API error:", data);
      return res.status(502).json({ error: data.error?.message || "AI service থেকে উত্তর পাওয়া যায়নি।" });
    }

    const answer = data.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ error: "AI খালি উত্তর দিয়েছে। আবার চেষ্টা করুন।" });
    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "সার্ভারে সমস্যা হয়েছে। পরে আবার চেষ্টা করুন।" });
  }
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Shawon AI running on port ${port}`));
