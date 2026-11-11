# Shawon AI

A mobile-friendly personal AI reply assistant. It drafts replies in the language used by the incoming message (Bangla, English, or Banglish). It does not send messages to Facebook or Messenger.

## Run locally

1. Install Node.js 20 or newer.
2. Copy `.env.example` to `.env`.
3. Put your Groq API key in `.env` as `GROQ_API_KEY`.
4. Check the current model name in your Groq console and set it as `GROQ_MODEL`.
5. Run `npm install`, then `npm start`.
6. Open `http://localhost:3000`.

## Important security notes

- Never commit `.env`, paste an API key into chat, or put the key in browser JavaScript.
- Keep the API key only in the hosting provider's server-side environment variables.
- This starter is a draft assistant, not an automatic Facebook personal-profile bot.
- Review every draft before sending, especially messages about money, bookings, promises, complaints, or private matters.
- Before public deployment, add rate limiting, usage limits, and abuse protection.
