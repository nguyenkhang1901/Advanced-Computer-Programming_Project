# Asia University AI Admission Consultant 🎓🤖

An automated admission consulting system powered by Artificial Intelligence (Google Gemini 2.5 Flash), specifically designed for Asia University Vietnam.

## 🌟 Key Features

### For Students (Frontend)
- **Bilingual Support:** Seamlessly switch between English and Vietnamese. The interface and AI responses adapt instantly.
- **Real-time AI Consultation:** Answers all questions regarding tuition fees, admission requirements, scholarships, and program details.
- **Automated Lead Generation:** A registration form automatically pops up after 3 messages to invite students to leave their contact info (Name, Email, Phone, Program of Interest).
- **Personalized Recommendations:** The AI analyzes chat history and preferences to provide the most suitable program/scholarship recommendations.

### For Administrators (Admin)
- **Secure Area:** The management interface is protected by a password (accessible by adding `/admin` to the URL).
- **Lead Management:** Displays the list of registered students. Includes an **Export CSV** button to download data for the admission team.
- **Chat History:** Stores and displays the entire conversation between students and the AI, allowing Admins to understand student needs.

### Data & System Architecture
- **Dynamic RAG (Retrieval-Augmented Generation):** The system does not use a complex Database to store knowledge. Instead, the AI dynamically loads data from all text files (`.txt`) in the `data/Data_raw/` directory. When there's new admission info, simply drop a text file here and the AI will learn it automatically.
- **One-Port Architecture:** A NodeJS Backend serves both the API and the built React frontend on the same port (Port 5000), making it easy to expose to the internet.

---

## 🛠️ Technology Stack

- **Frontend:** React.js (Vite), React Router, Lucide-react (Icons), React-markdown.
- **Backend:** Node.js, Express.js.
- **Database:** SQLite (Local storage for leads and chat history).
- **AI Engine:** `@google/genai` (Model: `gemini-2.5-flash`).
- **Deployment:** Localtunnel (Publicly exposes the website).

---

## 🚀 Setup & Execution Guide

### 1. System Requirements:
- **Node.js** installed (Version 18 or higher).
- Initialize libraries: Open the terminal in both the `backend` and `frontend` folders, and run the `npm install` command.

### 2. API Configuration (Very Important):
For security reasons, the real API Key is hidden. When downloading the code, you need to configure it as follows:
1. Go to the `backend/` folder and find the file named `.env.example`.
2. Rename that file to `.env`.
3. Open the `.env` file and replace the text `YOUR_GEMINI_API_KEY_HERE` with your own Gemini API Key (You can get this key completely free at *Google AI Studio*).

### 3. Startup Steps (For Windows):
The project includes an extremely convenient quick-start file.

1. Open the project's root folder.
2. Double-click the **`run.bat`** file.
3. Choose one of the 2 startup modes:

#### Mode [1]: Offline (For Developers)
- Starts Backend and Frontend in 2 separate windows (Dev mode).
- Accessible at: `http://localhost:5173`
- Code changes are updated immediately (Hot-reload).

#### Mode [2]: Online (For Deployment / Demo)
- Automatically builds the Frontend interface.
- Runs Backend and Frontend together on a single port (Port 5000).
- Automatically fetches your public IP address.
- Automatically initializes **Localtunnel** and provides a link like `https://xxx.loca.lt` to share with others.
- *(Tip: When others access it for the first time, provide them with the IP number displayed on your screen to bypass Localtunnel's security check).*

---

## 🔒 Admin Information
- **URL:** Go to the website link and append `/admin` (Example: `http://localhost:5173/admin` or `https://xxx.loca.lt/admin`).
- **Default Password:** `admin123`

---

## 📂 AI Knowledge Management
To add or update information for the AI consultant (Exam schedules, new programs, scholarships...):
1. Open the `data/Data_raw/` folder.
2. Create a new `.txt` file (or edit an existing one) and paste the text content.
3. Restart the `run.bat` file for the AI to update its knowledge.
