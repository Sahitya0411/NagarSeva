export type Profile = {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city: string;
  full_address: string;
  state: string;
  pincode: string;
  aadhaar_hash?: string;
  profile_photo_url?: string;
  city_coins: number;
  account_status: "active" | "warned" | "disabled";
  language_preference: string;
  created_at: string;
};

export type ComplaintStatus =
  | "submitted"
  | "ai_verified"
  | "routed"
  | "under_review"
  | "resolved"
  | "fraud"
  | "disputed";

export type Severity = "Low" | "Medium" | "High" | "Critical";

export type Complaint = {
  id: string;
  complaint_number: string;
  citizen_id: string;
  issue_type: string;
  severity: Severity;
  description: string;
  voice_note_url?: string;
  photo_urls: string[];
  location_lat?: number;
  location_lng?: number;
  location_address?: string;
  city: string;
  ward?: string;
  zone?: string;
  dept_name?: string;
  dept_email?: string;
  dept_phone?: string;
  ai_draft_email_subject?: string;
  ai_draft_email_body?: string;
  ai_confidence?: number;
  gemini_analysis?: GeminiAnalysis;
  status: ComplaintStatus;
  email_sent_at?: string;
  resolved_at?: string;
  coins_awarded: boolean;
  fraud_flag: boolean;
  fraud_reason?: string;
  created_at: string;
  updated_at: string;
};

export type GeminiAnalysis = {
  issue_type: string;
  severity: Severity;
  is_genuine: boolean;
  fraud_indicators: string[];
  department: string;
  dept_email: string;
  dept_phone: string;
  dept_website: string;
  search_confidence: number;
  draft_email: { subject: string; body: string };
  draft_email_local?: { subject: string; body: string };
  summary: string;
  suggested_resolution_days: number;
};

export type ComplaintTimeline = {
  id: string;
  complaint_id: string;
  status: string;
  note: string;
  updated_by: "citizen" | "admin" | "system";
  created_at: string;
};

export type CoinTransaction = {
  id: string;
  citizen_id: string;
  complaint_id?: string;
  type: "earned" | "redeemed" | "deducted";
  amount: number;
  description: string;
  created_at: string;
};

export type AdminUser = {
  id: string;
  name: string;
  role: string;
  created_at: string;
};

export type Language = {
  code: string;
  name: string;
  script: string;
  nativeName: string;
};

export const LANGUAGES: Language[] = [
  { code: "en", name: "English", script: "Aa", nativeName: "English" },
  { code: "hi", name: "Hindi", script: "हि", nativeName: "हिंदी" },
  { code: "mr", name: "Marathi", script: "म", nativeName: "मराठी" },
  { code: "ta", name: "Tamil", script: "த", nativeName: "தமிழ்" },
  { code: "te", name: "Telugu", script: "తె", nativeName: "తెలుగు" },
  { code: "bn", name: "Bengali", script: "ব", nativeName: "বাংলা" },
  { code: "gu", name: "Gujarati", script: "ગ", nativeName: "ગુજરાતી" },
  { code: "pa", name: "Punjabi", script: "ਪ", nativeName: "ਪੰਜਾਬੀ" },
  { code: "kn", name: "Kannada", script: "ಕ", nativeName: "ಕನ್ನಡ" },
  { code: "ml", name: "Malayalam", script: "മ", nativeName: "മലയാളം" },
  { code: "or", name: "Odia", script: "ଓ", nativeName: "ଓଡ଼ିଆ" },
  { code: "ur", name: "Urdu", script: "ا", nativeName: "اردو" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

export const ISSUE_TYPES = [
  "Road Pothole", "Road Damage", "Water Supply", "Water Leakage",
  "Electricity Outage", "Street Light", "Garbage Collection", "Drainage",
  "Sewage", "Tree Fall", "Noise Pollution", "Air Pollution",
  "Encroachment", "Stray Animals", "Park Maintenance", "Other"
];
