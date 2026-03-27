"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  ChevronLeft,
  Camera,
  Video,
  VideoOff,
  Mic,
  MicOff,
  X,
  RotateCcw,
  SwitchCamera,
} from "lucide-react";

interface CapturedMedia {
  blob: Blob;
  url: string;
  type: "photo" | "video";
  timestamp: string;
  location: string;
  lat: number;
  lng: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtTime(t: Date) {
  return t.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

function fmtRecording(secs: number) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/** Burns GPS + timestamp text onto a canvas and returns a new Blob */
async function stampPhoto(
  sourceBlob: Blob,
  label: string
): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(sourceBlob);
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      // Overlay band at bottom
      const bandH = Math.max(38, img.height * 0.05);
      ctx.fillStyle = "rgba(0,0,0,0.55)";
      ctx.fillRect(0, img.height - bandH, img.width, bandH);

      // Text
      const fontSize = Math.max(12, img.height * 0.022);
      ctx.font = `bold ${fontSize}px monospace`;
      ctx.fillStyle = "#ffba08";
      ctx.textBaseline = "middle";
      ctx.fillText(label, 10, img.height - bandH / 2);

      URL.revokeObjectURL(url);
      canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.92);
    };
    img.src = url;
  });
}

// ─── component ────────────────────────────────────────────────────────────────

export default function EvidencePage() {
  const router = useRouter();

  // GPS
  const [gpsPos, setGpsPos] = useState<{ lat: number; lng: number; addr: string } | null>(null);
  const [gpsLoading, setGpsLoading] = useState(true);

  // Camera
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraMode, setCameraMode] = useState<"photo" | "video">("photo");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [videoRecording, setVideoRecording] = useState(false);
  const [videoSeconds, setVideoSeconds] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);
  const videoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Captured media (up to 5)
  const [capturedMedia, setCapturedMedia] = useState<CapturedMedia[]>([]);

  // Voice
  const [voiceRecording, setVoiceRecording] = useState(false);
  const [voiceBlob, setVoiceBlob] = useState<Blob | null>(null);
  const [voiceSeconds, setVoiceSeconds] = useState(0);
  const voiceRecorderRef = useRef<MediaRecorder | null>(null);
  const voiceChunksRef = useRef<Blob[]>([]);
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Text
  const [textDesc, setTextDesc] = useState("");

  // ── GPS on mount ──
  useEffect(() => {
    sessionStorage.removeItem("ns_complaint_draft");
    if (!navigator.geolocation) {
      setGpsLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords;
        let addr = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
          );
          const json = await res.json();
          addr = json.display_name?.split(",").slice(0, 3).join(",") || addr;
        } catch { /* ignore */ }
        setGpsPos({ lat, lng, addr });
        setGpsLoading(false);
      },
      () => setGpsLoading(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  // ── open camera stream ──
  const openCamera = useCallback(async (mode: "photo" | "video", facing: "environment" | "user") => {
    // stop previous stream
    streamRef.current?.getTracks().forEach((t) => t.stop());
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: mode === "video",
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
      setCameraMode(mode);
      setFacingMode(facing);
      setCameraOpen(true);
    } catch {
      alert("Camera access denied. Please enable camera permissions.");
    }
  }, []);

  // ── close camera ──
  const closeCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setCameraOpen(false);
    setVideoRecording(false);
    if (videoTimerRef.current) clearInterval(videoTimerRef.current);
  }, []);

  // ── take photo ──
  const takePhoto = useCallback(async () => {
    if (!videoRef.current || !streamRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const rawBlob: Blob = await new Promise((res) => canvas.toBlob((b) => res(b!), "image/jpeg", 0.92));

    const now = new Date();
    const lat = gpsPos?.lat ?? 0;
    const lng = gpsPos?.lng ?? 0;
    const addr = gpsPos?.addr ?? "Location unavailable";
    const label = `📍${addr.slice(0, 50)} | 🕐${fmtTime(now)}`;

    const stampedBlob = await stampPhoto(rawBlob, label);
    const url = URL.createObjectURL(stampedBlob);

    setCapturedMedia((prev) => [
      ...prev,
      { blob: stampedBlob, url, type: "photo", timestamp: fmtTime(now), location: addr, lat, lng },
    ]);

    closeCamera();
  }, [gpsPos, closeCamera]);

  // ── start video recording ──
  const startVideoRecording = useCallback(() => {
    if (!streamRef.current) return;
    videoChunksRef.current = [];
    const mr = new MediaRecorder(streamRef.current, { mimeType: "video/webm;codecs=vp9,opus" });
    mr.ondataavailable = (e) => videoChunksRef.current.push(e.data);
    mr.onstop = async () => {
      const blob = new Blob(videoChunksRef.current, { type: "video/webm" });
      const now = new Date();
      const lat = gpsPos?.lat ?? 0;
      const lng = gpsPos?.lng ?? 0;
      const addr = gpsPos?.addr ?? "Location unavailable";
      const url = URL.createObjectURL(blob);
      setCapturedMedia((prev) => [
        ...prev,
        { blob, url, type: "video", timestamp: fmtTime(now), location: addr, lat, lng },
      ]);
      closeCamera();
    };
    mr.start();
    videoRecorderRef.current = mr;
    setVideoRecording(true);
    setVideoSeconds(0);
    videoTimerRef.current = setInterval(() => {
      setVideoSeconds((s) => {
        if (s >= 119) { stopVideoRecording(); return s; }
        return s + 1;
      });
    }, 1000);
  }, [gpsPos, closeCamera]);

  const stopVideoRecording = useCallback(() => {
    if (videoRecorderRef.current && videoRecording) {
      videoRecorderRef.current.stop();
      setVideoRecording(false);
      if (videoTimerRef.current) clearInterval(videoTimerRef.current);
    }
  }, [videoRecording]);

  // ── voice recording ──
  async function startVoiceRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      voiceChunksRef.current = [];
      const mr = new MediaRecorder(stream);
      mr.ondataavailable = (e) => voiceChunksRef.current.push(e.data);
      mr.onstop = () => {
        const blob = new Blob(voiceChunksRef.current, { type: "audio/webm" });
        setVoiceBlob(blob);
        stream.getTracks().forEach((t) => t.stop());
      };
      mr.start();
      voiceRecorderRef.current = mr;
      setVoiceRecording(true);
      setVoiceSeconds(0);
      voiceTimerRef.current = setInterval(() => {
        setVoiceSeconds((s) => {
          if (s >= 119) { stopVoiceRecording(); return s; }
          return s + 1;
        });
      }, 1000);
    } catch {
      alert("Microphone access denied. Please enable microphone permissions.");
    }
  }

  function stopVoiceRecording() {
    if (voiceRecorderRef.current && voiceRecording) {
      voiceRecorderRef.current.stop();
      setVoiceRecording(false);
      if (voiceTimerRef.current) clearInterval(voiceTimerRef.current);
    }
  }

  function removeMedia(index: number) {
    setCapturedMedia((prev) => {
      URL.revokeObjectURL(prev[index].url);
      return prev.filter((_, i) => i !== index);
    });
  }

  // ── continue ──
  function handleContinue() {
    // Photo or video is mandatory
    if (capturedMedia.length === 0) {
      alert("📷 A photo or video is required. Please capture at least one before continuing.");
      return;
    }

    // Pick first media item for location
    const firstMedia = capturedMedia[0];
    const draft = {
      textDescription: textDesc,
      transcript: "",
      photoCount: capturedMedia.length,
      hasVoice: !!voiceBlob,
      // pre-fill location from photo GPS if available
      lat: firstMedia?.lat || gpsPos?.lat || 0,
      lng: firstMedia?.lng || gpsPos?.lng || 0,
      locationAddress: firstMedia?.location || gpsPos?.addr || "",
    };
    sessionStorage.setItem("ns_complaint_draft", JSON.stringify(draft));
    (window as unknown as Record<string, unknown>).__nsEvidence = {
      photos: capturedMedia.map((m) => m.blob),
      photoUrls: capturedMedia.map((m) => m.url),
      voiceBlob,
      voiceDuration: voiceSeconds,
      transcript: "",
      textDescription: textDesc,
    };

    router.push("/complaint/new/location");
  }

  const hasAny =
    capturedMedia.length > 0 || voiceBlob !== null || textDesc.trim().length > 0;

  // ─── CAMERA VIEWFINDER OVERLAY ────────────────────────────────────────────
  if (cameraOpen) {
    return (
      <div
        style={{
          position: "fixed",
          inset: 0,
          background: "#000",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            background: "rgba(0,0,0,0.6)",
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 2,
          }}
        >
          <button
            onClick={closeCamera}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 10,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <X size={20} />
          </button>

          <div style={{ textAlign: "center" }}>
            <p style={{ color: "#fff", fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>
              {cameraMode === "photo" ? "📷 Take Photo" : "🎥 Record Video"}
            </p>
            {videoRecording && (
              <p style={{ color: "#fb7185", margin: 0, fontSize: "0.8rem", fontWeight: 600 }}>
                🔴 {fmtRecording(videoSeconds)} / 2:00
              </p>
            )}
          </div>

          <button
            onClick={() => openCamera(cameraMode, facingMode === "environment" ? "user" : "environment")}
            style={{
              background: "rgba(255,255,255,0.15)",
              border: "none",
              borderRadius: 10,
              width: 40,
              height: 40,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#fff",
            }}
          >
            <SwitchCamera size={20} />
          </button>
        </div>

        {/* Viewfinder */}
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          style={{ width: "100%", height: "100%", objectFit: "cover" }}
        />

        {/* GPS overlay on viewfinder */}
        <div
          style={{
            position: "absolute",
            bottom: 130,
            left: 0,
            right: 0,
            textAlign: "center",
            pointerEvents: "none",
          }}
        >
          <div
            style={{
              display: "inline-block",
              background: "rgba(0,0,0,0.55)",
              padding: "6px 14px",
              borderRadius: 20,
              fontSize: "0.72rem",
              color: "#ffba08",
              fontFamily: "monospace",
            }}
          >
            {gpsLoading
              ? "📍 Fetching GPS..."
              : gpsPos
              ? `📍 ${gpsPos.addr.slice(0, 45)} | 🕐 ${fmtTime(new Date())}`
              : "📍 GPS unavailable"}
          </div>
        </div>

        {/* Mode toggle + action buttons */}
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            background: "rgba(0,0,0,0.75)",
            padding: "16px 24px 32px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          {/* Mode toggle */}
          {!videoRecording && (
            <div
              style={{
                display: "flex",
                background: "rgba(255,255,255,0.12)",
                borderRadius: 30,
                padding: 4,
                gap: 4,
              }}
            >
              {(["photo", "video"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => openCamera(m, facingMode)}
                  style={{
                    padding: "8px 22px",
                    borderRadius: 24,
                    border: "none",
                    background: cameraMode === m ? "#fff" : "transparent",
                    color: cameraMode === m ? "#050d1a" : "rgba(255,255,255,0.6)",
                    fontWeight: 700,
                    fontSize: "0.82rem",
                    cursor: "pointer",
                    fontFamily: "DM Sans, sans-serif",
                    transition: "all 0.2s",
                  }}
                >
                  {m === "photo" ? "📷 Photo" : "🎥 Video"}
                </button>
              ))}
            </div>
          )}

          {/* Capture / record button */}
          {cameraMode === "photo" ? (
            <button
              id="capture-photo-btn"
              onClick={takePhoto}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#fff",
                border: "4px solid rgba(255,255,255,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(255,255,255,0.3)",
              }}
            >
              <Camera size={28} color="#050d1a" />
            </button>
          ) : videoRecording ? (
            <button
              id="stop-video-btn"
              onClick={stopVideoRecording}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#ef4444",
                border: "4px solid rgba(239,68,68,0.4)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                animation: "pulse-ring 1.5s ease-in-out infinite",
              }}
            >
              <VideoOff size={28} color="#fff" />
            </button>
          ) : (
            <button
              id="start-video-btn"
              onClick={startVideoRecording}
              style={{
                width: 72,
                height: 72,
                borderRadius: "50%",
                background: "#ef4444",
                border: "4px solid rgba(239,68,68,0.3)",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Video size={28} color="#fff" />
            </button>
          )}
        </div>
      </div>
    );
  }

  // ─── MAIN EVIDENCE FORM ───────────────────────────────────────────────────
  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 40, background: "#050d1a" }}>
      {/* Header */}
      <div className="page-header">
        <button
          onClick={() => router.back()}
          style={{
            background: "rgba(255,255,255,0.08)",
            border: "none",
            borderRadius: 10,
            width: 38,
            height: 38,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "#f0f4ff",
          }}
        >
          <ChevronLeft size={20} />
        </button>
        <div>
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Add Evidence</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.8rem", margin: 0 }}>
            Step 1 of 3 — Capture &amp; Describe
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "12px 20px 0" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "33%" }} />
        </div>
      </div>

      <div style={{ padding: "20px" }}>

        {/* ── GPS status ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "10px 14px",
            background: gpsPos
              ? "rgba(52,211,153,0.08)"
              : "rgba(255,186,8,0.08)",
            border: `1px solid ${gpsPos ? "rgba(52,211,153,0.2)" : "rgba(255,186,8,0.2)"}`,
            borderRadius: 12,
            marginBottom: 20,
            fontSize: "0.82rem",
          }}
        >
          <span style={{ fontSize: "1.1rem" }}>{gpsPos ? "📍" : "⏳"}</span>
          <span style={{ color: gpsPos ? "#34d399" : "#ffba08" }}>
            {gpsLoading
              ? "Fetching your GPS location..."
              : gpsPos
              ? `${gpsPos.addr.slice(0, 55)}`
              : "GPS unavailable — location may not be attached"}
          </span>
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 1: Photo / Video capture (REQUIRED)
            ═══════════════════════════════════════════════ */}
        <div
          style={{
            background: capturedMedia.length === 0
              ? "rgba(251,113,133,0.04)"
              : "rgba(255,255,255,0.03)",
            border: capturedMedia.length === 0
              ? "1.5px solid rgba(251,113,133,0.4)"
              : "1px solid rgba(52,211,153,0.25)",
            borderRadius: 18,
            padding: "18px",
            marginBottom: 18,
            transition: "border-color 0.3s, background 0.3s",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                width: 36,
                height: 36,
                background: "rgba(56,189,248,0.12)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
              }}
            >
              📷
            </span>
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>Photo &amp; Video</p>
              <p style={{ color: "rgba(240,244,255,0.45)", margin: 0, fontSize: "0.78rem" }}>
                Real-time capture only · GPS &amp; time auto-tagged
              </p>
            </div>
            <div style={{ marginLeft: "auto", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
              {capturedMedia.length === 0 && (
                <span
                  style={{
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    color: "#fb7185",
                    background: "rgba(251,113,133,0.15)",
                    border: "1px solid rgba(251,113,133,0.3)",
                    padding: "2px 8px",
                    borderRadius: 6,
                    letterSpacing: "0.04em",
                  }}
                >
                  REQUIRED
                </span>
              )}
              <span
                style={{
                  fontSize: "0.72rem",
                  color: capturedMedia.length === 0 ? "rgba(251,113,133,0.7)" : "rgba(52,211,153,0.8)",
                  background: capturedMedia.length === 0 ? "rgba(251,113,133,0.08)" : "rgba(52,211,153,0.08)",
                  padding: "4px 8px",
                  borderRadius: 8,
                  fontWeight: 600,
                }}
              >
                {capturedMedia.length} / 5
              </span>
            </div>
          </div>

          {/* Capture buttons */}
          {capturedMedia.length < 5 && (
            <div style={{ display: "flex", gap: 10, marginBottom: capturedMedia.length > 0 ? 14 : 0 }}>
              <button
                id="open-photo-btn"
                onClick={() => openCamera("photo", "environment")}
                style={{
                  flex: 1,
                  padding: "14px 10px",
                  borderRadius: 14,
                  border: "2px dashed rgba(56,189,248,0.35)",
                  background: "rgba(56,189,248,0.06)",
                  cursor: "pointer",
                  color: "#38bdf8",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                <Camera size={18} /> Take Photo
              </button>
              <button
                id="open-video-btn"
                onClick={() => openCamera("video", "environment")}
                style={{
                  flex: 1,
                  padding: "14px 10px",
                  borderRadius: 14,
                  border: "2px dashed rgba(167,139,250,0.35)",
                  background: "rgba(167,139,250,0.06)",
                  cursor: "pointer",
                  color: "#a78bfa",
                  fontWeight: 700,
                  fontSize: "0.88rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  fontFamily: "DM Sans, sans-serif",
                  transition: "all 0.2s",
                }}
              >
                <Video size={18} /> Record Video
              </button>
            </div>
          )}

          {/* Media grid */}
          {capturedMedia.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 8,
              }}
            >
              {capturedMedia.map((m, i) => (
                <div
                  key={i}
                  style={{
                    position: "relative",
                    aspectRatio: "1",
                    borderRadius: 10,
                    overflow: "hidden",
                    background: "#0a1628",
                    border: "1px solid rgba(255,255,255,0.1)",
                  }}
                >
                  {m.type === "photo" ? (
                    <img
                      src={m.url}
                      alt={`Capture ${i + 1}`}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                    />
                  ) : (
                    <video
                      src={m.url}
                      style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      muted
                      playsInline
                    />
                  )}
                  {/* type badge */}
                  <div
                    style={{
                      position: "absolute",
                      top: 4,
                      left: 4,
                      background: m.type === "photo" ? "rgba(56,189,248,0.85)" : "rgba(167,139,250,0.85)",
                      borderRadius: 6,
                      padding: "2px 6px",
                      fontSize: "0.6rem",
                      fontWeight: 700,
                      color: "#fff",
                    }}
                  >
                    {m.type === "photo" ? "📷" : "🎥"}
                  </div>
                  {/* remove */}
                  <button
                    onClick={() => removeMedia(i)}
                    style={{
                      position: "absolute",
                      top: 4,
                      right: 4,
                      background: "rgba(0,0,0,0.7)",
                      border: "none",
                      borderRadius: "50%",
                      width: 22,
                      height: 22,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                    }}
                  >
                    <X size={11} color="#fff" />
                  </button>
                </div>
              ))}

              {/* add more tile */}
              {capturedMedia.length < 5 && (
                <button
                  onClick={() => openCamera("photo", "environment")}
                  style={{
                    aspectRatio: "1",
                    borderRadius: 10,
                    border: "2px dashed rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.03)",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "rgba(240,244,255,0.3)",
                  }}
                >
                  +
                </button>
              )}
            </div>
          )}
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 2: Voice note
            ═══════════════════════════════════════════════ */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: "18px",
            marginBottom: 18,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                width: 36,
                height: 36,
                background: "rgba(52,211,153,0.12)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
              }}
            >
              🎙️
            </span>
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>Voice Note</p>
              <p style={{ color: "rgba(240,244,255,0.45)", margin: 0, fontSize: "0.78rem" }}>
                Hold to record · any language · max 2 min
              </p>
            </div>
            {voiceBlob && (
              <button
                onClick={() => { setVoiceBlob(null); setVoiceSeconds(0); }}
                style={{
                  marginLeft: "auto",
                  background: "rgba(251,113,133,0.15)",
                  border: "1px solid rgba(251,113,133,0.3)",
                  borderRadius: 8,
                  padding: "4px 10px",
                  color: "#fb7185",
                  fontSize: "0.72rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                <RotateCcw size={10} /> Redo
              </button>
            )}
          </div>

          {/* Record area */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
            {!voiceBlob ? (
              <>
                <button
                  id="voice-record-btn"
                  className={`record-btn ${voiceRecording ? "recording" : ""}`}
                  onMouseDown={startVoiceRecording}
                  onTouchStart={startVoiceRecording}
                  onMouseUp={stopVoiceRecording}
                  onTouchEnd={stopVoiceRecording}
                  style={{ userSelect: "none", WebkitUserSelect: "none" }}
                >
                  {voiceRecording ? <MicOff size={28} color="#fff" /> : <Mic size={28} color="#fff" />}
                </button>
                {voiceRecording ? (
                  <div style={{ textAlign: "center" }}>
                    <p style={{ color: "#fb7185", fontWeight: 700, margin: "0 0 6px" }}>
                      🔴 {fmtRecording(voiceSeconds)}
                    </p>
                    <div className="waveform" style={{ justifyContent: "center" }}>
                      {Array.from({ length: 10 }).map((_, i) => (
                        <div
                          key={i}
                          className="wave-bar"
                          style={{ animationDelay: `${i * 0.1}s`, height: `${Math.random() * 30 + 10}px` }}
                        />
                      ))}
                    </div>
                  </div>
                ) : (
                  <p style={{ color: "rgba(240,244,255,0.4)", fontSize: "0.82rem", textAlign: "center" }}>
                    Hold the microphone to record
                  </p>
                )}
              </>
            ) : (
              <div
                style={{
                  width: "100%",
                  padding: 14,
                  background: "rgba(52,211,153,0.08)",
                  border: "1px solid rgba(52,211,153,0.2)",
                  borderRadius: 12,
                }}
              >
                <p style={{ color: "#34d399", fontWeight: 600, fontSize: "0.85rem", marginBottom: 8 }}>
                  ✅ Voice recorded ({fmtRecording(voiceSeconds)})
                </p>
                <audio
                  src={URL.createObjectURL(voiceBlob)}
                  controls
                  style={{ width: "100%", filter: "invert(1) hue-rotate(180deg) brightness(0.85)" }}
                />
              </div>
            )}
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════
            SECTION 3: Text description
            ═══════════════════════════════════════════════ */}
        <div
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 18,
            padding: "18px",
            marginBottom: 20,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <span
              style={{
                width: 36,
                height: 36,
                background: "rgba(255,186,8,0.12)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "1.2rem",
              }}
            >
              ✍️
            </span>
            <div>
              <p style={{ fontWeight: 700, margin: 0, fontSize: "0.95rem" }}>Text Description</p>
              <p style={{ color: "rgba(240,244,255,0.45)", margin: 0, fontSize: "0.78rem" }}>
                Optional · more detail = better AI routing
              </p>
            </div>
          </div>

          <textarea
            id="text-description"
            className="input-field"
            placeholder="e.g., Large pothole on main road near Andheri market, causing accidents for 3 weeks..."
            value={textDesc}
            onChange={(e) => setTextDesc(e.target.value)}
            style={{ minHeight: 120, marginBottom: 6 }}
          />
          <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.3)", textAlign: "right" }}>
            {textDesc.length} / 1000
          </p>
        </div>

        {/* ── Evidence summary chips ── */}
        {hasAny && (
          <div
            style={{
              padding: "12px 16px",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 12,
              marginBottom: 20,
            }}
          >
            <p style={{ fontSize: "0.72rem", color: "rgba(240,244,255,0.45)", marginBottom: 8 }}>
              EVIDENCE SUMMARY
            </p>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {capturedMedia.filter((m) => m.type === "photo").length > 0 && (
                <span className="chip active">
                  📷 {capturedMedia.filter((m) => m.type === "photo").length} photo
                  {capturedMedia.filter((m) => m.type === "photo").length > 1 ? "s" : ""}
                </span>
              )}
              {capturedMedia.filter((m) => m.type === "video").length > 0 && (
                <span className="chip active">
                  🎥 {capturedMedia.filter((m) => m.type === "video").length} video
                  {capturedMedia.filter((m) => m.type === "video").length > 1 ? "s" : ""}
                </span>
              )}
              {voiceBlob && (
                <span className="chip active">🎙️ Voice ({fmtRecording(voiceSeconds)})</span>
              )}
              {textDesc.trim().length > 0 && (
                <span className="chip active">✍️ {textDesc.length} chars</span>
              )}
            </div>
          </div>
        )}

        {/* AI info */}
        <div className="alert alert-info" style={{ marginBottom: 12 }}>
          <span>🤖</span>
          <span>
            AI will transcribe your voice note and analyse all evidence to route your complaint.
          </span>
        </div>

        {/* Required warning */}
        {capturedMedia.length === 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "10px 14px",
              background: "rgba(251,113,133,0.08)",
              border: "1px solid rgba(251,113,133,0.25)",
              borderRadius: 12,
              marginBottom: 16,
              fontSize: "0.82rem",
              color: "#fb7185",
            }}
          >
            <span>📷</span>
            <span>At least one photo or video is required to submit a complaint.</span>
          </div>
        )}

        {/* Continue */}
        <button
          id="continue-evidence-btn"
          className="btn-primary"
          onClick={handleContinue}
          disabled={capturedMedia.length === 0}
          style={{
            opacity: capturedMedia.length === 0 ? 0.45 : 1,
            cursor: capturedMedia.length === 0 ? "not-allowed" : "pointer",
            transition: "opacity 0.3s",
          }}
        >
          Continue to Location →
        </button>
      </div>
    </main>
  );
}
