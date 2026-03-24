<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ca398b91-c72e-4405-8589-2ce5487388c7

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Deployment (Vercel)

To deploy this project to Vercel, follow these steps:

1. Connect your repository to Vercel.
2. In the Vercel Dashboard, go to **Settings > Environment Variables**.
3. Add the following variables:
   - `GEMINI_API_KEY`: Your Google Gemini API Key.
   - `VITE_SUPABASE_URL`: Your Supabase Project URL.
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Project Anon/Public Key.
4. Vercel will automatically detect the Vite project and use `npm run build` with the `dist` output directory.

> [!IMPORTANT]
> Ensure all Supabase variables are prefixed with `VITE_` so they are available in the client-side code.

