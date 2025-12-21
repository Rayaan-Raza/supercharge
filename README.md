# PromptElevate 🚀

Transform "Human-Lazy" English into "AI-Optimized" prompts using a sophisticated Meta-Prompting engine powered by Gemini 2.0 Flash.

## Features

- **35-Criteria Evaluation**: Analyzes your prompt across clarity, context, hallucination risks, and more
- **Intelligent Refinement**: Automatically enhances prompts with personas, structure, and guardrails
- **Premium Dark UI**: Modern glassmorphism design with JetBrains Mono typography
- **Rate Limited**: 5 requests per 12 hours per IP to prevent abuse
- **No Sign-up**: Get value in under 5 seconds

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Lucide Icons
- **Backend**: Flask (Vercel Serverless) + Gemini 2.0 Flash
- **Rate Limiting**: Upstash Redis

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Gemini API key ([Get one here](https://aistudio.google.com/))
- Upstash Redis account (optional, for rate limiting)

### Local Development

1. **Clone and install frontend dependencies:**
   ```bash
   cd frontend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

3. **Run the frontend:**
   ```bash
   cd frontend
   npm run dev
   ```

4. **Run the backend (in another terminal):**
   ```bash
   cd api
   pip install -r requirements.txt
   python index.py
   ```

5. Open `http://localhost:5173`

### Deployment to Vercel

1. Push to GitHub
2. Import the repo in Vercel
3. Add environment variables in Vercel dashboard:
   - `GEMINI_API_KEY`
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
4. Deploy!

## How It Works

1. **Input Phase**: User enters their raw, "human-lazy" prompt
2. **Evaluation Phase**: Engine analyzes across 35 criteria (clarity, context, anti-hallucination, etc.)
3. **Refinement Phase**: Applies insights to produce an elite, structured prompt
4. **Output Phase**: User receives a supercharged prompt ready for any AI

## License

MIT
