# CarDex Local Migration & Development Guide

Welcome to your local **CarDex** project! This document outlines everything you need to know to export, configure, run, and deploy CarDex in your local development environment (such as VS Code).

---

## 1. How to Export/Download Your Project
To download your project from Google AI Studio:
1. Click on the **Settings** gear icon in the top right corner or the left sidebar menu of the Google AI Studio Build UI.
2. Under the Project options, click **Export to ZIP** or **Push to GitHub** if you prefer version control integration.
3. If downloading as a ZIP, extract the contents of the ZIP folder into a dedicated project directory on your computer (e.g., `~/Projects/cardex`).

---

## 2. Local System Prerequisites
Before opening the project, ensure you have the following software installed:

*   **Node.js**: **Version 20.x or higher** (LTS version recommended).
    *   *Verify installation*: Run `node -v` in your terminal.
*   **npm**: Included with Node.js (Version 10.x or higher).
    *   *Verify installation*: Run `npm -v` in your terminal.
*   **Git** (Recommended): For source control and deployment pipelines.
    *   *Verify installation*: Run `git --version` in your terminal.
*   **VS Code Extensions** (Recommended):
    *   **Tailwind CSS IntelliSense**: For autocompletion of CSS utility classes.
    *   **ESLint / Prettier**: To keep your code clean, readable, and standard.
    *   **TypeScript Tailwind CSS Plugin**: Helps with TypeScript style bindings.

---

## 3. First-Time Setup & Installation
Once the project folder is extracted:
1. Open VS Code, select **File > Open Folder**, and choose the extracted root folder.
2. Open the integrated terminal in VS Code (`Ctrl + \`` or `Cmd + \``).
3. Run the following command to clean install all required dependencies listed in `package.json`:
   ```bash
   npm install
   ```

---

## 4. Installed Dependencies Overview
CarDex is structured as a full-stack Node/Express application utilizing modern TypeScript. The primary dependencies are:
*   **Backend**: `express` (routing), `@google/genai` (modern Gemini SDK), `multer` (multipart/form-data parser for image scans), `dotenv` (environment variables), and `tsx` (TypeScript executor).
*   **Frontend**: `react` (UI framework), `vite` (bundler), `@tailwindcss/vite` (Tailwind CSS v4 engine), `motion` (elegant fluid animations), and `lucide-react` (high-quality icons).

---

## 5. Creating a Local `.env` File
In the root directory of your project, you will find a `.env.example` file. 
1. Duplicate or copy this file and name the copy **`.env`**:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your private API credentials (do NOT check this `.env` file into Git or public code repositories!).

---

## 6. Required & Optional Environment Variables
Your `.env` file should contain the following declarations:

```env
# ==============================================================================
# CARDEX LOCAL ENVIRONMENT CONFIGURATION
# ==============================================================================

# 1. Google Gemini API Key (REQUIRED)
# Obtain from: https://aistudio.google.com/
# Format: AIzaSy... (40-character alphanumeric string)
GEMINI_API_KEY=your_gemini_api_key_here

# 2. API Ninjas Cars API Key (OPTIONAL but Highly Recommended)
# Obtain from: https://api-ninjas.com/api/cars
# Format: alphanumeric string (e.g. jf8sK...v2)
# If omitted, CarDex will automatically fallback to Gemini for factual engine specs.
API_NINJAS_API_KEY=your_api_ninjas_api_key_here

# 3. Running Environment Profile (Optional)
# Options: development, production
NODE_ENV=development

# 4. Port Binding (Optional)
# Default: 3000
PORT=3000
```

---

## 7. Replacing AI Studio Secrets
Within Google AI Studio, secrets are securely injected at runtime via environment configurations. Locally, the `dotenv` package handles this injection automatically. 
*   Simply adding `import "dotenv/config"` at the top of `server.ts` (which is already configured) ensures that any variables listed in your local `.env` file are populated directly into Node's `process.env`.
*   You **do not** need to change any references to `process.env.GEMINI_API_KEY` or `process.env.API_NINJAS_API_KEY` in the code; they will load from `.env` flawlessly.

---

## 8. Code Compatibility Outside of AI Studio
The current application setup is fully optimized and requires **zero** modifications to run locally! 
*   The `server.ts` serves both as your API gateway and your Vite front-end assets server.
*   In development, Express mounts Vite as an active middleware proxy to support rapid UI testing and HMR.
*   In production, Express serves compiled static files from the build output directory `dist/`.

---

## 9. Starting the Local Servers
CarDex runs both the frontend and backend on a **single, unified port (3000)** to bypass CORS issues entirely.

To run the app in **development mode** (with live hot-reloading for code edits):
```bash
npm run dev
```
*Your terminal will display:*
`[Pipeline] Server running on http://localhost:3000`

---

## 10. Localhost Access & Testing URLs
Once the development server is started, you can access your local application interfaces at the following URLs:

*   **User Interface (Frontend)**: [http://localhost:3000](http://localhost:3000)
*   **Car Recognition API Endpoint**: [http://localhost:3000/api/detect](http://localhost:3000/api/detect)
*   **Presets Database Endpoint**: [http://localhost:3000/api/presets](http://localhost:3000/api/presets)

---

## 11. End-to-End Verification Checklist
Once your server is running on `localhost:3000`, verify the features using this step-by-step checklist:

1.  **Open User Interface**: Navigate to `http://localhost:3000` in Google Chrome or your browser of choice. Ensure the UI loads.
2.  **Test Gemini Scanner / Detector**: Upload an image of a car in the scanner interface. Verify that the system scans, outlines bounding segments, and populates the details.
3.  **Validate API Ninjas Integration**: Check your terminal logs. When a car is recognized, you should see logs indicating whether API Ninjas returned the technical specs:
    `[API Ninjas] Searching database for [Make] [Model]...`
4.  **Confirm Fallback Performance**: Temporarily empty your `API_NINJAS_API_KEY` in `.env` and scan a car. The backend should log a fallback lookup to Gemini specs instead:
    `[Pipeline] API Ninjas yielded no results. Querying Gemini Specs Fallback...`
5.  **Verify JSON Database Growth**: Navigate to the catalog page. See if newly scanned cars appear in your collection. Open `catalog_db.json` in VS Code and check if the entries have been added to the local JSON list.

---

## 12. Troubleshooting & Common Local Errors

### Error: "Port 3000 is already in use"
*   **Why**: Another local server (like another project, Docker, or a ghost process) is utilizing port 3000.
*   **Fix**: You can terminate the blocking process, or change the `PORT` variable in your `.env` file to another value (e.g., `PORT=3500`) and restart.

### Error: "Missing API key" or "GEMINI_API_KEY variable is missing"
*   **Why**: Your `.env` file is misnamed, located in the wrong directory, or the variables were not saved.
*   **Fix**: Verify your `.env` file is named exactly `.env` (not `.env.txt` or `.env.local`), is placed in the root folder alongside `package.json`, and contains the correct alphanumeric value.

### Error: "Module not found" or "Cannot find module 'tsx'"
*   **Why**: Node modules were either not installed or failed due to system state.
*   **Fix**: Run `rm -rf node_modules package-lock.json && npm install` to clean install all package trees.

### Error: "CORS blocks fetch request"
*   **Why**: Front-end requests are hardcoded to a separate domain or host, bypassing our unified Express port.
*   **Fix**: The frontend is pre-configured to make requests to relative paths (e.g., `/api/...`). Do not use full URLs with ports in frontend `fetch()` statements.

---

## 13. File & Config Customizations
You **do not** need to edit `tsconfig.json`, `vite.config.ts`, or `package.json` for local hosting. 
*   The system uses `@tailwindcss/vite` configured inside `vite.config.ts` to process Tailwind v4 styles natively.
*   TypeScript compile-checks are already pre-bound with `@types/express`, `@types/node`, and `@types/multer`.

---

## 14. Building for Production
Before deploying your application to a production environment, you must bundle and optimize the project assets:

1.  **Generate Production Builds**: Run the build script in your terminal:
    ```bash
    npm run build
    ```
    *   This compiles your React frontend into an optimized single-page build inside the `dist/` folder.
    *   It bundles your backend code into a single high-performance CommonJS file at `dist/server.cjs` using `esbuild`.
2.  **Test Production Locally**: Run the compiled server as it would run in the cloud:
    ```bash
    npm run start
    ```
    Now, test your application at `http://localhost:3000`.

---

## 15. Production Cloud Deployment Options
When you are ready to take CarDex online, we recommend the following deployment strategies:

### Option A: Fully Unified Container (Railway or Render) - *Highly Recommended*
Because CarDex runs as a single, self-contained Node Express server serving static assets, it deploys flawlessly on container-hosting platforms like **Railway** or **Render**.
1.  Connect your GitHub repository to **Railway** (https://railway.app) or **Render** (https://render.com).
2.  Set the start command to `npm run start`.
3.  Add your production environment variables (`GEMINI_API_KEY` and `API_NINJAS_API_KEY`) in the platform's Environment Settings dashboard.
4.  The platform will build the React assets and run the Node server instantly on a secure, public HTTPS domain.

### Option B: Cloud Run (GCP)
To deploy onto the same production architecture Google AI Studio uses, you can deploy a Docker container to **Google Cloud Run**. The project's single-port binding structure matches Cloud Run's ingress routing guidelines precisely out-of-the-box!
