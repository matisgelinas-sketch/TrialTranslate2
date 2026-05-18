# TrialTranslate

Plain-English clinical trial summaries powered by Groq + Llama 3.3.

## Local dev
1. `npm install`
2. Copy `.env.local.example` to `.env.local` and add your Groq key from https://console.groq.com
3. `npm run dev` → open http://localhost:3000

## Deploy to Vercel
1. Push this folder to a GitHub repo
2. Import the repo at https://vercel.com/new
3. Add env var `GROQ_API_KEY` in Project Settings → Environment Variables
4. Deploy
