# 🛡️ SentinelUPI — Real-Time Visual Fraud & Social Engineering Interceptor
> **Affecio Hacks '26 Submission** | Cyber Threat Intelligence & Payment Security

SentinelUPI is an autonomous cybersecurity forensic tool designed to protect users and merchants against fake payment receipts, malicious UPI QR intent payloads, and high-pressure scam SMS messages using real-time multimodal AI forensics.

---

## 🚀 Key Features

- **Receipt Forensics Engine**: Inspects transaction confirmation screenshots to catch fake payment generator APKs, font irregularities, and invalid RBI 12-digit UTR numbers.
- **UPI QR & Intent Auditor**: Parses raw UPI links (e.g. `upi://pay?...`) to detect "collect vs pay" inverted requests, unverified merchant masking, and parameter tampering.
- **SMS & Urgency Detector**: Evaluates coercive language, fake utility disconnection threats, and psychological scam patterns.
- **Signed Forensic Audit PDF**: One-click generation of a timestamped forensic report containing detected threat vectors and defensive recommendations.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, TypeScript)
- **Styling**: Tailwind CSS, Lucide React
- **AI Forensic Engine**: Google Gemini Flash via `@google/genai`
- **Document Generation**: jsPDF

---

## 💻 Getting Started Locally

### 1. Prerequisites
- Node.js (v20+ or latest LTS)
- A Gemini API Key from Google AI Studio

### 2. Installation
```bash
git clone [https://github.com/aryanm1224/sentinel-upi.git]
cd sentinel-upi
npm install
```

### 3. Environment Setup
Create a `.env.local` file in the root directory:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

### 4. Run the Project
```bash
npm run dev
```

Open http://localhost:3000 in your browser.

---

## 👥 Author
- **Team**: SentinelOps (Solo)
- **Event**: Affecio Hacks '26
