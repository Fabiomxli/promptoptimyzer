# Suno Prompt Optimyzer by DJ H Salcido

Professional tool for optimizing Suno v5.5 prompts with technical FX injection and character limit maximization.

## Local Installation

To run this application on your own machine (outside of AI Studio), follow these steps:

1. **Clone the repository** (or download the source code).
2. **Install dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (you can copy `.env.example`):
   ```bash
   cp .env.example .env
   ```
   Edit `.env` and provide your values:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `PORT`: Set this to `3151` (or any port you prefer).
   - `NODE_ENV`: Set to `development` or `production`.

4. **Run the Development Server**:
   ```bash
   npm run dev
   ```
   The application will be available at `http://localhost:3151`.

## Features

- **Smart Optimize**: Powered by Gemini AI to transform simple descriptions into high-fidelity Suno prompts.
- **Style Console**: Technical FX injection (Mastering, Texture, Spatial, etc.) specifically tuned for Suno v5.5.
- **Script Builder**: Easy tagging for vocals, atmosphere, and instrumentation.
- **Auto-Inflation**: Automatically optimizes length to hit the 1000/5000 character sweet spots for better AI results.
- **Live Preview**: Real-time visualization of the final prompt buffer.

## Deployment

To build the application for production:

```bash
npm run build
npm start
```

## Credits

Developed by **DJ H Salcido**.
Powered by Suno v5.5 Prompt Engineering logic.
