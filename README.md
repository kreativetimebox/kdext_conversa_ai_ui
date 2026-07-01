# ConversaAI Chatbot UI Frontend

A modern, high-fidelity, and premium Web interface for the **ConversaAI Voice Gateway**. This React + Vite application provides a polished chatbot dashboard featuring secure user authentication, chat and translate modes, Speech-to-Text (STT) transcription, and Text-to-Speech (TTS) synthesis with dynamic speaker selections.

## Architecture Position

This is **Service #1** (Frontend) in the ConversaAI architecture.

| # | Service | Port | Relation to UI |
|---|---|---|---|
| **1** | **Frontend (this)** | **—** | **Chat / translate / voice UI** |
| 2 | Gateway | 8001 | **The only backend this UI talks to** |
| 3 | LLM service | 8008 | Proxied by gateway (not called directly) |
| 5 | STT engine | 8002 | Proxied by gateway (not called directly) |
| 6 | TTS engine | 8000 | Proxied by gateway (not called directly) |

The frontend communicates **exclusively** with the Gateway API (`:8001`). All other services (LLM, STT, TTS, vLLM) are on a private network and are accessed only through the gateway.

### Real-time Voice Path

For live voice chat, the request flows through the system as follows:

```
Frontend ──► Gateway :8001 ──► LLM service :8008 ──► vLLM :8007     (chat, streamed via SSE)
                                                 ├──► Edge/Bing TTS  (MP3 streaming)
                                                 └──► STT :8002      (transcription)
```

### Authentication Flow

```
Sign Up → OTP Email Verification → Sign In → JWT + API Key
    │                                           │
    └── POST /signup                            ├── JWT (Authorization: Bearer) → /profile
                                                └── API Key (X-API-Key) → /api/*, /v1/*, /conversations, /text-to-speech, etc.
```

---

## Features

### 1. Authentication & Security
* **Sign In & Sign Up:** Responsive login and registration screens with client-side password hashing.
* **OTP Verification:** Re-routing to a dedicated One-Time Password verification screen upon registration to prevent unverified logins.
* **API Key Management:** View and manage user-specific API keys securely from the dashboard.

### 2. Conversational Dashboard & Hub
* Interactive chat sidebar with session history logs.
* Direct workspace view showing integration options, API metrics, and project configurations.
* **Chat mode:** Converse with the LLM (proxied through gateway → LLM service → vLLM).
* **Translate mode:** Real-time translation using LLM or free Google API (proxied through gateway → LLM service).

### 3. Text-to-Speech (TTS) Tool
* **Interactive Synthesis:** Synthesize multi-sentence English or Indic texts in real-time.
* **Dynamic Speaker Filtering:** 
  * Automatically filters the dropdown voices based on the chosen language.
  * **Indic Languages** show AI4Bharat Parler-TTS speakers (*Divya, Sita, Meera, Priya, Rohit, Arjun, Vikram, Amir*).
  * **Global / Non-Indic Languages** show Suno Bark speakers (*Bark Female 1/2/3, Bark Male 1*).
* **Audio Player:** In-app audio player to play, pause, seek, and download synthesized audio files directly.

### 4. Speech-to-Text (STT) Tool
* **Real-time Microphone Recording:** Record audio clips directly from the browser using the Web Audio API.
* **File Uploads:** Drag-and-drop or select pre-recorded audio files (`.wav`, `.mp3`, `.webm`, `.flac`, etc.) up to 25MB.
* **Timeline Analysis:** Displays transcribed text alongside word-by-word timestamps and speaker/segment details.

### 5. Chat History & Conversations
* Create, view, update, and delete conversations.
* Messages stored server-side with full conversation context.
* Supports both **chat** and **translate** conversation modes.

---

## Gateway API Endpoints Used

The frontend consumes these gateway endpoints:

| Category | Endpoints | Auth |
|---|---|---|
| Account | `POST /signup` · `POST /verify-otp` · `POST /login` · `GET /profile` | OTP / JWT |
| Chat (proxy → LLM) | `POST /api/chat` · `POST /api/translate` | `X-API-Key` |
| Voice (proxy → LLM) | `POST /api/voice/tts` · `POST /api/voice/stt` | `X-API-Key` |
| Models | `GET /api/models` · `GET /api/engine-health` | `X-API-Key` |
| OpenAI surface | `POST /v1/chat/completions` · `GET /v1/models` | `X-API-Key` |
| Conversations | `POST/GET /conversations` · `GET/PATCH/DELETE /conversations/{id}` · `POST /conversations/{id}/messages` | `X-API-Key` |
| Voice tools | `GET /voices` | `X-API-Key` |

---

## Tech Stack

* **Core Framework:** React 18 with Vite (HMR and fast dev server builds).
* **Styling:** TailwindCSS for responsive, dark-mode-first glassmorphic interfaces.
* **Icons:** `lucide-react`.
* **API Client:** Axios for gateway API communication.

---

## Getting Started

### Prerequisites
* **Node.js** (v18+ recommended)
* **NPM** or **Yarn**

### Installation

1. Navigate to the UI project root:
   ```bash
   cd kdext_conversa_ai_ui
   ```

2. Install the package dependencies:
   ```bash
   npm install
   ```

3. Configure the environment variables. Copy `.env.production` (or create `.env`) and set your Gateway URL:
   ```env
   VITE_API_URL=http://localhost:8001
   ```

4. Start the local development server:
   ```bash
   npm run dev
   ```

5. Build the production package:
   ```bash
   npm run build
   ```

---

## Docker Deployment

The project includes a `Dockerfile` and `nginx.conf` for production deployment:

```bash
docker build -t conversa-ui .
docker run --rm -p 80:80 conversa-ui
```

The Docker image uses **nginx** to serve the built static assets. Configure the gateway URL via environment variable at build time:

```bash
docker build --build-arg VITE_API_URL=https://api.yoursite.com -t conversa-ui .
```

The `nginx.conf` handles SPA routing (all paths → `index.html`) and static asset caching.

---

## Project Structure

```text
kdext_conversa_ai_ui/
├── src/
│   ├── assets/              # Static images, styles, and logos
│   ├── components/
│   │   ├── Navbar.jsx       # Navigation bar with auth state
│   │   └── Footer.jsx       # Global footer
│   ├── services/
│   │   └── api.js           # Axios API client (gateway communication)
│   ├── views/
│   │   ├── Auth/
│   │   │   ├── SignIn.jsx   # Login screen
│   │   │   └── SignUp.jsx   # Registration + OTP verification
│   │   ├── Resources/       # Additional resource views
│   │   ├── Dashboard.jsx    # Main dashboard hub
│   │   ├── VoiceTools.jsx   # TTS + STT interactive tools
│   │   ├── History.jsx      # Conversation history viewer
│   │   ├── LandingPage.jsx  # Public landing page
│   │   ├── ApiReference.jsx # API documentation reference
│   │   └── Documentation.jsx # User documentation
│   ├── App.jsx              # App routing and layout coordinator
│   ├── main.jsx             # App mounting and CSS imports
│   └── index.css            # Global styles
├── public/                  # Static public assets
├── index.html               # HTML template (Tailwind, Fonts)
├── vite.config.js           # Vite compilation configurations
├── eslint.config.js         # ESLint configuration
├── nginx.conf               # Production nginx configuration
├── Dockerfile               # Production Docker build
├── .env.production          # Production environment variables
└── package.json             # Dependencies and scripts
```
