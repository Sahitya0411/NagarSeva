// Helper utilities

export function generateComplaintNumber(): string {
  const num = Math.floor(Math.random() * 9000) + 1000;
  return `C${num}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor(diff / (1000 * 60));

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  
  return date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

export function formatFullDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function getStatusLabel(status: string): string {
  const map: Record<string, string> = {
    submitted: "Submitted",
    ai_verified: "AI Verified",
    routed: "Routed",
    under_review: "Under Review",
    resolved: "Resolved",
    fraud: "Fraud",
    disputed: "Disputed",
  };
  return map[status] || status;
}

export function getSeverityColor(severity: string): string {
  const map: Record<string, string> = {
    Low: "#34d399",
    Medium: "#fbbf24",
    High: "#fb7185",
    Critical: "#ef4444",
  };
  return map[severity] || "#94a3b8";
}

export function getIssueTypeIcon(issueType: string): string {
  const map: Record<string, string> = {
    "Road Pothole": "🕳️",
    "Road Damage": "🛣️",
    "Water Supply": "💧",
    "Water Leakage": "🚿",
    "Electricity Outage": "⚡",
    "Street Light": "💡",
    "Garbage Collection": "🗑️",
    Drainage: "🌊",
    Sewage: "🔧",
    "Tree Fall": "🌳",
    "Noise Pollution": "🔊",
    "Air Pollution": "🌫️",
    Encroachment: "🚧",
    "Stray Animals": "🐕",
    "Park Maintenance": "🌿",
    Other: "📋",
  };
  return map[issueType] || "📋";
}

export async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data URL prefix
      resolve(result.split(",")[1]);
    };
    reader.onerror = reject;
  });
}

export function coinsToRupees(coins: number): string {
  return `₹${(coins / 100).toFixed(2)}`;
}

export function rupeesToCoins(rupees: number): number {
  return rupees * 100;
}

export function validatePincode(pincode: string): boolean {
  return /^\d{6}$/.test(pincode);
}

export function validatePhone(phone: string): boolean {
  return /^[6-9]\d{9}$/.test(phone);
}

export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function haversineDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000; // metres
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lng2 - lng1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c;
}

export function truncate(str: string, len: number): string {
  if (str.length <= len) return str;
  return str.slice(0, len) + "...";
}
