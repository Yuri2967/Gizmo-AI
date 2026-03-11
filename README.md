# Gizmo AI 💬

**A premium, privacy-focused, and multimodal web client for Google's Gemini models.**

Gizmo AI is a high-performance, zero-dependency chat interface designed with a native Apple-esque aesthetic. It runs entirely in your browser, connecting directly to the Google Gemini API. With its floating input design and high-density menus, Gizmo offers a top-tier user experience without the need for a backend or data harvesting.

🔗 **Live Demo:** https://yuri2967.github.io/Gizmo-AI/

---

## ✨ Features

### 🖥️ Native-Level UI/UX
*   **Floating Input Bar:** A modern, isolated input container that allows long-form text to overflow neatly.
*   **Glassmorphic Design:** Premium `backdrop-filter` effects with unified 85% transparency and 20px blur across all menus, popups, and dropdowns.
*   **Snappy Controls:** Custom-built dropdowns and menus optimized with `pointer-events` for instant, lag-free responsiveness.
*   **Inline Editing & Management:** Edit your sent messages or rename your chats directly on the screen without annoying browser prompts.
*   **Completely Password-Manager Safe:** Unique architecture completely hides the text inputs from aggressive password extensions (like Apple Keychain or 1Password), ensuring they never block your view.

### 🧠 Intelligent Conversational State
*   **Per-Chat Model Memory:** Choose different models (Gemini 3.1 Flash Lite, Gemma 3, etc.) for different threads—Gizmo remembers your preference per conversation.
*   **Real-Time Streaming:** Responses stream in chunk-by-chunk using Server-Sent Events (SSE) for a fluid reading experience.
*   **Sliding Window Memory:** Optimized token management that keeps context relevant while staying within API limits.

### 🔬 Advanced Rendering & Tools
*   **Flawless LaTeX Math:** Integrated `KaTeX` support effortlessly handles complex chemical formulas ($CO_2$) and mathematical equations ($\sqrt{x}$), complete with a fail-safe fallback to prevent ugly rendering errors.
*   **Smart Copy & Audio:** The "Copy" and "Listen" tools automatically strip out invisible code and raw markdown formatting, giving you perfect plain text output.
*   **Multimodal Support:** Upload, drag-and-drop, or paste (`Ctrl+V`) images, PDFs, and code files directly into the chat.
*   **Anti-Bricking Logic:** Gizmo detects file generation errors and automatically strips problematic attachments from history to keep your chat flowing.

### 🌱 Environmental Awareness
*   **Impact Tracking:** Live estimation of the power (Wh) and water (ml) used for your specific chat session, calculated using dynamic heuristics based on the size of the AI model selected.
*   **Relatable Context:** Click the info icon (ⓘ) to see your usage translated into real-world metrics, like "% of a smartphone charge" or "bottles of water."

---

## 🛠️ Tech Stack

*   **Core:** Vanilla HTML5, CSS3 (Flexbox/Grid), JavaScript (ES6+).
*   **Markdown:** `marked.js` for high-speed text rendering.
*   **Math:** `KaTeX` and `marked-katex-extension` for robust equation formatting.
*   **Security:** `DOMPurify` for rigorous XSS protection.
*   **API:** Direct REST/SSE integration with Google Generative Language API (V1Beta).

---

## 🚀 Getting Started

Since Gizmo AI is a static web application, no installation or build tools are required.

### 1. Setup
1.  **Clone/Download** this repository.
2.  Open `index.html` in any modern browser (Chrome, Safari, Edge, Firefox).

### 2. Connect to Gemini
1.  Obtain a free API key from **[Google AI Studio](https://aistudio.google.com/app/apikey)**.
2.  In Gizmo, click the **Plus (+)** button on the floating input bar.
3.  Paste your key into the **API Key** field.
4.  Gizmo saves this locally to your browser; it is **never** sent to any third-party server.

---

## 🔒 Privacy & Security

*   **Client-Side Only:** There is no server between you and Google.
*   **Local Storage:** Your chat history, model preferences, and API keys remain on your physical device.
*   **Secure Input:** The interface is engineered to completely bypass credential managers, ensuring your data is handled purely as chat queries.