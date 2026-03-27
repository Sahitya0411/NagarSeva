# 🏙️ NagarSeva - आपकी आवाज़, आपका शहर
### *Your Voice, Your City*

> **Hackathon Submission · Theme: Smart Cities**
> An AI-powered civic complaint management platform that empowers citizens to report urban issues instantly - turning passive frustration into verified, actionable change.

---

## 📌 Table of Contents
1. [The Problem](#-the-problem)
2. [Our Solution](#-our-solution)
3. [Real-Life Examples](#-real-life-examples)
4. [How It Works - End to End](#-how-it-works--end-to-end)
5. [Key Features](#-key-features)
6. [Technology Stack](#-technology-stack)
7. [System Architecture](#-system-architecture)
8. [AI Pipeline](#-ai-pipeline--google-gemini)
9. [Anti-Fraud Mechanism](#-anti-fraud--evidence-integrity)
10. [CityCoins Reward System](#-citycoins-reward-system)
11. [Multilingual Support](#-multilingual-support)
12. [Admin Dashboard](#-admin-dashboard)
13. [Database Schema](#-database-schema)
14. [Impact & Scale](#-impact--scale)
15. [Setup & Installation](#-setup--installation)
16. [Future Roadmap](#-future-roadmap)
17. [Team](#-team)

---

## 🚨 The Problem

India has **4,000+ municipalities** managing the daily lives of over **500 million urban citizens**. Yet the civic complaint system remains broken:

| Pain Point | Reality |
|---|---|
| **No unified channel** | Citizens must know *which* department handles *what* - roads, water, electricity, sanitation all have separate portals |
| **Unverified complaints** | Text-only complaints are easy to fake, leading to distrust and inaction |
| **Zero accountability** | Once filed, complaints vanish into bureaucratic black holes with no tracking |
| **Language barrier** | Most portals are English-only, excluding non-English speakers |
| **No incentive to participate** | Citizens get nothing for their civic effort |
| **Slow routing** | Complaints land at the wrong department due to manual categorisation |

### 🔴 A Real Scenario Without NagarSeva

> Ravi, a factory worker in Hyderabad, notices a broken streetlight outside his building. He doesn't know if it's the GHMC, TSSPDCL (electricity board), or the ward office's responsibility. He searches Google, finds three different portals, tries to register on one, fills out a long form in English (his third language), attaches a photo from his gallery that's days old and has no location data, and submits. He never hears back.

**Result:** The complaint is ignored. Ravi never tries again. The streetlight stays broken for months.

---

## ✅ Our Solution

**NagarSeva** is a **mobile-first, AI-powered civic complaint portal** that:

- Accepts complaints as **real-time photo + video + voice + text** (or any combination)
- **Auto-stamps evidence** with GPS coordinates and timestamp - defeating fake/old media
- Uses **Google Gemini AI** to analyse, classify, and route the complaint to the correct department automatically
- **Sends a professional complaint email** on the citizen's behalf
- **Tracks status in real-time** with a timeline
- **Rewards citizens** with CityCoins redeemable for real money when their complaint gets resolved
- Works in **multiple Indian languages**

---

## 🌍 Real-Life Examples

### Example 1: The Pothole Problem 🕳️
**Without NagarSeva:**
- Priya photographs a pothole on her street
- She doesn't know if it's the PWD, Municipal Corporation, or NHAI's jurisdiction
- She uploads a photo taken last week from her gallery (no GPS proof)
- The complaint gets dismissed as "unverifiable" or goes to the wrong department

**With NagarSeva:**
1. Priya opens NagarSeva → taps **Report Issue**
2. She opens the **in-app camera** - her GPS coordinates (`28.6139°N, 77.2090°E`) and current timestamp (`20 Mar 2026, 09:34:21`) are **burned onto the photo automatically**
3. She records a **10-second voice note** in Hindi: *"यहाँ सड़क पर बड़ा गड्ढा है, बाइक वाले गिर रहे हैं"* (There's a big pothole here, motorcyclists are falling)
4. Gemini AI analyses her photo + voice → identifies **"Pothole / Road Damage"**, severity **High**, routes to **PWD (Public Works Department) Delhi**
5. A formal complaint email is drafted and sent to `pwd.delhi@nic.in` with photo evidence attached
6. Priya receives complaint ID **`NS-DEL-20260320-0047`**
7. Status updates arrive: `Submitted → AI Verified → Routed → Under Review → Resolved`
8. When resolved, Priya earns **100 CityCoins** ≈ ₹1 - which accumulates over time

---

### Example 2: The Overflowing Drain 🚰
**Citizen:** Arjun, Bengaluru | **Issue:** Drainage overflow causing flooding in his lane

1. Arjun opens NagarSeva (set to **Kannada** language)
2. Records a **live video** (up to 2 minutes) of the flooded drain - GPS + timestamp burned as metadata
3. Adds a **text note**: *"ಚರಂಡಿ ತುಂಬಿ ಹರಿಯುತ್ತಿದೆ, ರಸ್ತೆಯಲ್ಲಿ ನೀರು ನಿಂತಿದೆ"* (Drain overflowing, water stagnating on road)
4. Gemini detects: **Drainage / Waterlogging**, Severity: **Critical**
5. Auto-routes to **BBMP Drainage Department**, Bengaluru
6. AI also checks for **duplicate complaints** within 50 metres - finds 2 existing complaints about the same drain → auto-links and escalates priority
7. Arjun tracks realtime status from his dashboard

---

### Example 3: The Fraud Deterrence 🚨
**Bad actor:** Someone tries to submit a complaint with an old photo from the internet of a broken road in another city.

- NagarSeva **blocks file uploads** - only **real-time camera capture is allowed**
- The GPS overlay is computed live and burned onto the canvas using the Web Camera API
- Gemini's vision model cross-checks the image metadata, surrounding context, and description for **inconsistencies**
- If fraud indicators are detected, the complaint is auto-flagged as `fraud`, the citizen receives a warning
- Repeated abuse → **account disabled**

---

## 🔄 How It Works - End to End

```
Citizen Opens App
       │
       ▼
[1] Language Selection (Hindi / English / Telugu / Kannada / Tamil / Bengali / Marathi / Gujarati)
       │
       ▼
[2] Register / Login (Supabase Auth + optional Aadhaar hash for verification)
       │
       ▼
[3] Evidence Collection (REAL-TIME ONLY)
       ├── 📷 Live Photo (GPS + timestamp burned onto image canvas)
       ├── 🎥 Live Video (up to 2 min, GPS + timestamp in metadata)
       ├── 🎙️ Voice Note (up to 2 min audio recording)
       └── ✍️ Text Description
       │
       ▼
[4] Location Confirmation (Google Maps pin, auto-filled from GPS)
       │
       ▼
[5] AI Analysis (Google Gemini 1.5 Pro)
       ├── Classify issue type (Pothole / Water / Electricity / Garbage / Drainage...)
       ├── Assess severity (Low / Medium / High / Critical)
       ├── Identify responsible department
       ├── Find department email/phone
       ├── Draft professional complaint email
       ├── Check for fraud indicators
       └── Check for nearby duplicate complaints
       │
       ▼
[6] Auto-Email Sent to Concerned Department (via Resend API)
       │
       ▼
[7] Complaint ID Generated + Timeline Tracking begins
       │
       ▼
[8] Status Updates: submitted → ai_verified → routed → under_review → resolved
       │
       ▼
[9] 🎉 Resolution → Citizen earns 100 CityCoins
```

---

## 🌟 Key Features

### 1. 📱 Mobile-First Design
- Full-screen camera viewfinder inside the app
- Front/rear camera toggle
- Progress bar through submission steps (Evidence → Location → AI Review → Submit)
- Dark theme, accessible on low-end Android devices

### 2. 🔒 Tamper-Proof Evidence
- **No file uploads allowed** - only live captures
- GPS address and timestamp **burned directly onto the photo canvas** using HTML5 Canvas API
- Video recordings tagged with location metadata
- Impossible to submit old media or photos from another location

### 3. 🤖 Google Gemini AI Integration
- **Multi-modal analysis**: Simultaneously processes image, audio transcript, and text
- Identifies civic issue type from a curated taxonomy
- Determines severity: `Low → Medium → High → Critical`
- Looks up the correct government department and their contact details
- Generates a professionally worded complaint email in the citizen's language
- Detects fraud signals and inconsistencies

### 4. 📊 Real-Time Status Tracking
- Every status change is logged in `complaint_timeline`
- Citizens see a visual timeline: 🟡 Submitted → 🔵 AI Verified → 🟣 Routed → 🟠 Under Review → 🟢 Resolved
- Complaint detail page shows department name, email, AI confidence score

### 5. 🪙 CityCoins Gamification
- Earn **100 CityCoins** per resolved complaint
- **1000 CityCoins = ₹10** redeemable via wallet
- Leaderboard potential (future)
- Deductions for flagged fraud attempts

### 6. 🌐 8 Indian Languages
- Hindi 🇮🇳 | English | Telugu | Kannada | Tamil | Bengali | Marathi | Gujarati
- Language stored in user profile, used in AI email drafts

### 7. 🛡️ Anti-Abuse Rate Limiting
- Maximum **5 complaints per day** per citizen
- Nearby duplicate detection within **~50 metre radius** in last 30 days
- Fraud flagging → account warning system → account disable

### 8. 👮 Admin Dashboard
- Super admin can view all complaints across cities
- Can manually escalate / mark resolved / flag fraud
- View timeline for each complaint

---

## 🛠️ Technology Stack

| Layer | Technology | Purpose |
|---|---|---|
| **Frontend** | Next.js 14 (App Router) | Mobile-first PWA |
| **Styling** | Tailwind CSS v4 | Utility-first responsive design |
| **Language** | TypeScript | Type-safe development |
| **Database** | Supabase (PostgreSQL) | Auth + data storage + RLS |
| **AI Engine** | Google Gemini 2.5 Flash | Multi-modal analysis + email drafting |
| **Email Delivery** | Resend API | Department email delivery |
| **Maps** | Google Maps API + Nominatim | GPS reverse geocoding |
| **Media Capture** | WebRTC MediaDevices API | Real-time camera & microphone |
| **Image Stamping** | HTML5 Canvas API | GPS/timestamp burn-in |
| **i18n** | i18next + react-i18next | 8 Indian languages |
| **Icons** | Lucide React | Consistent UI icons |
| **Hosting** | Vercel (planned) | Edge deployment |

---

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    CITIZEN (Mobile App)                  │
│  Next.js PWA · TypeScript · Tailwind CSS                 │
│                                                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐  │
│  │ Camera   │  │  Voice   │  │  Text    │  │  Maps  │  │
│  │ WebRTC   │  │  WebRTC  │  │  Input   │  │  GPS   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────┘  │
└──────────────────────────┬──────────────────────────────┘
                           │ HTTPS
┌──────────────────────────▼──────────────────────────────┐
│                  NEXT.JS API ROUTES                       │
│  /api/complaint/submit  · /api/complaint/resolve          │
│  /api/complaint/flag-fraud · /api/complaint/send-email    │
│  /api/wallet · /api/auth                                 │
└───────────┬──────────────────────────────────┬──────────┘
            │                                  │
┌───────────▼──────────┐         ┌─────────────▼──────────┐
│   SUPABASE (DB)       │         │  GOOGLE GEMINI API      │
│  ─ profiles           │         │  ─ Vision (image)       │
│  ─ complaints         │         │  ─ Audio (voice)        │
│  ─ complaint_timeline │         │  ─ Text (description)   │
│  ─ coin_transactions  │         │  ─ JSON response        │
│  ─ admin_users        │         └─────────────┬──────────┘
│  ─ RLS Policies       │                       │
└───────────┬──────────┘              ┌──────────▼─────────┐
            │                         │   RESEND API        │
            │                         │  Email to Dept.     │
┌───────────▼──────────┐              └────────────────────┘
│   ADMIN DASHBOARD     │
│  Super admin panel    │
│  Complaint management │
└──────────────────────┘
```

---

## 🤖 AI Pipeline - Google Gemini

**Model Used:** `gemini-2.5-flash` (multi-modal)

### Input to Gemini:
```json
{
  "images": ["<base64 JPEG with GPS watermark>"],
  "voiceTranscript": "यहाँ सड़क पर बड़ा गड्ढा है...",
  "textDescription": "Big pothole near Gate 4",
  "locationAddress": "Lajpat Nagar, New Delhi",
  "city": "New Delhi",
  "state": "Delhi",
  "ward": "Ward 42",
  "userLanguage": "hi",
  "lat": 28.6139,
  "lng": 77.2090
}
```

### Output from Gemini:
```json
{
  "is_genuine": true,
  "issue_type": "Pothole / Road Damage",
  "severity": "High",
  "department": "Public Works Department (PWD) Delhi",
  "dept_email": "pwd.delhi@nic.gov.in",
  "dept_phone": "011-23378527",
  "dept_website": "pwd.delhi.gov.in",
  "search_confidence": 0.91,
  "fraud_indicators": [],
  "summary": "Large pothole on road near Gate 4, Lajpat Nagar causing safety hazard",
  "suggested_resolution_days": 7,
  "draft_email": {
    "subject": "Urgent: Pothole at Lajpat Nagar causing safety hazard - Complaint #NS-DEL-0047",
    "body": "Dear PWD Delhi Officer,\n\nA serious pothole has been identified at Lajpat Nagar, New Delhi (28.6139°N, 77.2090°E)...\n\nPhotographic evidence with GPS and timestamp is attached. Immediate action is requested.\n\nRegards,\nCitizen via NagarSeva"
  },
  "draft_email_local": {
    "subject": "अत्यावश्यक: लाजपत नगर में गड्ढा - शिकायत #NS-DEL-0047",
    "body": "माननीय PWD दिल्ली अधिकारी,\n\nलाजपत नगर, नई दिल्ली में एक बड़े गड्ढे की सूचना दी जा रही है..."
  }
}
```

---

## 🛡️ Anti-Fraud & Evidence Integrity

| Mechanism | Implementation |
|---|---|
| **No file uploads** | Only `navigator.mediaDevices.getUserMedia` - live camera only |
| **GPS watermark** | Coordinates burned onto photo canvas at shot time using `HTML5 Canvas API` |
| **Timestamp watermark** | `new Date()` burned at shot time - cannot be altered post-capture |
| **Rate limiting** | Max 5 complaints/day per user (`HTTP 429` with clear message) |
| **Duplicate detection** | Haversine-approximated ~50m radius check vs. last 30 days |
| **Gemini fraud detection** | AI analyses for contextual inconsistencies, stock images, fabricated scenes |
| **Account sanctions** | Warning → Disabled status, visible in UI |
| **Aadhaar hash** | Optional identity anchoring during registration |

---

## 🪙 CityCoins Reward System

```
Citizen resolves complaint ──▶ +100 CityCoins
Fraud complaint detected  ──▶ -50 CityCoins (deduction)
Manual redemption         ──▶ 1000 coins = ₹10 via UPI/Wallet

coin_transactions table tracks:
  - earned    (complaint resolved)
  - deducted  (fraud penalty)
  - redeemed  (citizen cashes out)
```

### Why CityCoins?
- Citizens see **direct value** in making their city better
- Deters spam/fraud through **loss aversion**
- Creates a data-driven, engaged civic community
- Future potential: **top civic contributor leaderboards**, certificates, recognition from local bodies

---

## 🌐 Multilingual Support

Supported languages at launch:

| Code | Language | Script |
|---|---|---|
| `hi` | Hindi | हिंदी |
| `en` | English | English |
| `te` | Telugu | తెలుగు |
| `kn` | Kannada | ಕನ್ನಡ |
| `ta` | Tamil | தமிழ் |
| `bn` | Bengali | বাংলা |
| `mr` | Marathi | मराठी |
| `gu` | Gujarati | ગુજરાતી |

- Language selected at **first launch** and saved to user profile
- AI complaint emails drafted in the citizen's language
- i18next-based translations throughout the UI

---

## 👮 Admin Dashboard

The super admin panel (`/admin`) provides:

- **All complaints** across all cities, filterable by status / city / severity
- **One-click resolve** with timeline update
- **Fraud flagging** with reason
- **Citizen account management** (warn / disable)
- **Coin transaction management** - manually award / deduct
- **Department email resend** in case of first-time failure
- Secured by `admin_users` table with Supabase RLS

---

## 🗄️ Database Schema

```sql
── profiles ──────────────────────────────────────────────────
  id (UUID)           → Supabase auth user
  full_name, email, phone, city, state, pincode
  aadhaar_hash        → Optional, bcrypt hashed
  city_coins          → Running coin balance
  account_status      → active | warned | disabled
  language_preference → User's chosen language

── complaints ────────────────────────────────────────────────
  complaint_number    → e.g. NS-DEL-20260320-0047
  citizen_id          → FK to profiles
  issue_type          → AI classified category
  severity            → Low | Medium | High | Critical
  description         → Text entered by citizen
  voice_note_url      → Supabase Storage URL
  photo_urls[]        → Array of Supabase Storage URLs
  location_lat/lng    → GPS from evidence capture
  city, ward, zone    → Location breakdown
  dept_name/email     → AI identified department
  ai_draft_email_*    → AI generated subject + body
  ai_confidence       → 0.0–1.0 confidence score
  gemini_analysis     → Full JSONB from Gemini
  status              → submitted | ai_verified | routed | 
                         under_review | resolved | fraud | disputed
  fraud_flag          → Boolean
  coins_awarded       → Boolean (prevent double-awarding)

── complaint_timeline ────────────────────────────────────────
  complaint_id        → FK to complaints
  status              → Status at this point
  note                → Human/AI readable note
  updated_by          → citizen | admin | system

── coin_transactions ─────────────────────────────────────────
  citizen_id          → FK to profiles
  complaint_id        → FK to complaints (nullable)
  type                → earned | redeemed | deducted
  amount              → Integer coins
  description         → Human readable reason
```

---

## 📈 Impact & Scale

### Problem Scale in India
- **5,000+** civic issues reported across Indian cities **every hour**
- Average resolution time: **14–90 days** in most municipalities
- **< 30%** of civic complaints ever get a response

### NagarSeva's Potential Impact
| Metric | Current System | With NagarSeva |
|---|---|---|
| Time to reach correct dept. | 3–7 days (manual routing) | **< 60 seconds** (AI routing) |
| Evidence verifiability | Low (any photo) | **100%** (live GPS-stamped) |
| Duplicate filtering | Manual / none | **Automatic (50m radius)** |
| Citizen language | English only (most portals) | **8 Indian languages** |
| Incentive to report | None | **CityCoins → real money** |
| Fraud deterrence | Minimal | **Multi-layer AI + technical** |

### Target Cities for Launch
- Delhi NCR
- Bengaluru
- Hyderabad
- Mumbai
- Pune
- Chennai

---

## ⚙️ Setup & Installation

### Prerequisites
- Node.js 18+
- Supabase account
- Google Gemini API key
- Resend API key
- Google Maps API key (for geocoding)

### 1. Clone & Install
```bash
git clone https://github.com/your-username/nagarseva.git
cd nagarseva
npm install
```

### 2. Environment Variables
Create `.env.local`:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GEMINI_API_KEY=your_gemini_api_key
RESEND_API_KEY=your_resend_api_key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_api_key
```

### 3. Database Setup
Run `supabase-schema.sql` in your Supabase SQL Editor.

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000)

### 5. Create Admin Account
After signing up through the app, run in Supabase SQL Editor:
```sql
INSERT INTO admin_users (id, name, role)
VALUES ('<your-user-uuid>', 'Admin Name', 'super_admin');
```

---

## 🔭 Future Roadmap

| Phase | Feature |
|---|---|
| **v1.1** | Push notifications for status updates |
| **v1.2** | City-wide complaint heatmap (public view) |
| **v1.3** | UPI wallet redemption for CityCoins |
| **v1.4** | Government department portal login (view incoming complaints) |
| **v2.0** | Offline-first PWA with sync on connectivity |
| **v2.1** | Community upvoting - citizens can upvote existing complaints |
| **v2.2** | Automated follow-up emails if unresolved after X days |
| **v2.3** | SLA tracking - public dashboard of dept resolution rates |
| **v3.0** | Integration with Smart City Command & Control Centres |
| **v3.1** | WhatsApp bot interface for feature phones |

---

## 👩‍💻 Team

**Project:** NagarSeva
**Institute:** IIIT Delhi
**Event:** WitchHunt 2026 · Smart Cities Theme

| Member | Role |
|---|---|
| Sahitya | Full Stack Developer · AI Integration · System Design |

---

## 📄 License

MIT License - Open source for civic good.

---

> *NagarSeva is built on the belief that every citizen deserves a city that listens. Technology should be the bridge between people and the systems that serve them.*

**🏙️ आपकी आवाज़, आपका शहर · Your Voice, Your City**
