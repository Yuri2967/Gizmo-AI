# Gizmo AI 💬

**A premium, privacy-focused web client for Google's Gemini models.**

Gizmo AI is a lightweight, zero-dependency chat interface designed with a clean aesthetic. It runs entirely in your browser, connecting directly to the Google Gemini API without intermediate servers, ensuring your chat history and API keys stay on your device.

🔗 **Live Demo:** https://yuri2967.github.io/Gizmo-AI/

## ✨ Features

*   **Premium UI/UX:** A clean, glassmorphic interface inspired by iOS and macOS, featuring smooth transitions and a responsive sidebar.
*   **Multi-Model Support:** Switch instantly between models like **Gemini 3.1 Flash Lite**, **Gemma 3 27B**, and others.
*   **Multimodal Capabilities:** Upload images for analysis, code debugging, or creative inspiration.
*   **Markdown Support:** Full rendering for code blocks, tables, lists, and formatted text (powered by `marked.js` & `DOMPurify`).
*   **Voice Interaction:** Built-in Text-to-Speech (TTS) to listen to AI responses.
*   **Smart History:**
    *   Chat sessions are saved automatically to your browser's `localStorage`.
    *   Rename, delete, or switch between conversations easily.
    *   **Sliding Window Memory:** Configurable context limits to manage token usage efficiently.
*   **Dark/Light Mode:** Toggle between themes to match your system or preference.
*   **Export & Tools:** Copy code snippets or full messages with a single click.

## 🚀 Getting Started

Since Gizmo AI is a static web application, there is no installation or build process required.

### Option 1: Run Locally
1.  **Clone or Download** this repository.
2.  Open `index.html` directly in any modern web browser (Chrome, Safari, Edge, Firefox).
3.  That's it!

### Option 2: Deploy
You can host this for free on GitHub Pages, Vercel, or Netlify by simply uploading the files (`index.html`, `style.css`, `script.js`).

## ⚙️ Configuration

To use Gizmo, you need a Google Gemini API Key.

1.  Get your free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2.  Open Gizmo AI.
3.  Click the **Settings Gear ⚙️** icon in the input bar.
4.  Paste your key into the **API Key** field.
5.  (Optional) Adjust your **Model** and **Memory** settings.

**Note:** Your API key is saved in your browser's Local Storage. It is never sent to any third-party server other than Google's API endpoint.

## 🛠️ Tech Stack

*   **Core:** Vanilla HTML5, CSS3, JavaScript (ES6+).
*   **Dependencies:**
    *   `marked.js` (Markdown parsing)
    *   `DOMPurify` (Security/Sanitization)
*   **Storage:** `localStorage` (Client-side state management).
*   **Icons:** Minimalist SVG icons.

## 🔒 Privacy & Security

Gizmo AI is designed to be **Client-Side Only**.
*   **No Backend:** There is no server processing your messages.
*   **Direct Connection:** Requests go strictly from `Your Browser` -> `Google Gemini API`.
*   **Data Persistence:** Chat history and API keys persist only on your specific device and browser. Clearing your browser cache will remove your chat history.
