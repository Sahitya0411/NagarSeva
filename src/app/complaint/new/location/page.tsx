"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, MapPin, Search, Navigation } from "lucide-react";

declare global {
  interface Window {
    google: typeof google;
    initGoogleMaps: () => void;
  }
}

export default function LocationPage() {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<google.maps.Map | null>(null);
  const markerRef = useRef<google.maps.Marker | null>(null);

  const [address, setAddress] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [lat, setLat] = useState(19.076); // Default: Mumbai
  const [lng, setLng] = useState(72.877);
  const [locating, setLocating] = useState(false);
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [ward, setWard] = useState("");

  useEffect(() => {
    // Check if draft exists
    const draft = sessionStorage.getItem("ns_complaint_draft");
    if (!draft) {
      router.replace("/complaint/new");
      return;
    }

    // Load Google Maps
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey || apiKey === "your_google_maps_api_key") {
      // Show map placeholder without API key
      setMapsLoaded(false);
      return;
    }

    window.initGoogleMaps = () => {
      setMapsLoaded(true);
    };

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    document.head.appendChild(script);

    return () => {
      document.head.removeChild(script);
    };
  }, []);

  useEffect(() => {
    if (mapsLoaded && mapRef.current) {
      initMap();
    }
  }, [mapsLoaded]);

  function initMap() {
    if (!mapRef.current) return;

    mapInstance.current = new window.google.maps.Map(mapRef.current, {
      center: { lat, lng },
      zoom: 15,
      styles: [
        { elementType: "geometry", stylers: [{ color: "#0a1628" }] },
        { elementType: "labels.text.fill", stylers: [{ color: "#8ec3b9" }] },
        { featureType: "water", elementType: "geometry", stylers: [{ color: "#050d1a" }] },
        { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e3f7a" }] },
        { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#162d58" }] },
        { featureType: "poi", stylers: [{ visibility: "off" }] },
      ],
      disableDefaultUI: true,
      zoomControl: true,
    });

    markerRef.current = new window.google.maps.Marker({
      position: { lat, lng },
      map: mapInstance.current,
      draggable: true,
      icon: {
        url: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(`
          <svg xmlns="http://www.w3.org/2000/svg" width="36" height="48" viewBox="0 0 36 48">
            <ellipse cx="18" cy="46" rx="8" ry="3" fill="rgba(0,0,0,0.3)"/>
            <path d="M18 2 C9 2 2 9 2 18 C2 32 18 46 18 46 C18 46 34 32 34 18 C34 9 27 2 18 2Z" fill="#ffba08"/>
            <circle cx="18" cy="18" r="7" fill="#050d1a"/>
          </svg>
        `),
        scaledSize: new window.google.maps.Size(36, 48),
        anchor: new window.google.maps.Point(18, 48),
      },
    });

    markerRef.current.addListener("dragend", () => {
      const pos = markerRef.current?.getPosition();
      if (pos) {
        setLat(pos.lat());
        setLng(pos.lng());
        reverseGeocode(pos.lat(), pos.lng());
      }
    });

    mapInstance.current.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        markerRef.current?.setPosition(e.latLng);
        setLat(e.latLng.lat());
        setLng(e.latLng.lng());
        reverseGeocode(e.latLng.lat(), e.latLng.lng());
      }
    });

    reverseGeocode(lat, lng);
  }

  async function reverseGeocode(latitude: number, longitude: number) {
    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    try {
      const res = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
      );
      const data = await res.json();
      if (data.results?.[0]) {
        setAddress(data.results[0].formatted_address);
      }
    } catch {
      setAddress(`${latitude.toFixed(4)}, ${longitude.toFixed(4)}`);
    }
  }

  async function useCurrentLocation() {
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        setLat(latitude);
        setLng(longitude);
        if (mapInstance.current) {
          mapInstance.current.setCenter({ lat: latitude, lng: longitude });
          markerRef.current?.setPosition({ lat: latitude, lng: longitude });
        }
        reverseGeocode(latitude, longitude);
        setLocating(false);
      },
      () => {
        setLocating(false);
        alert("Unable to get your location. Please pin manually.");
      },
      { enableHighAccuracy: true }
    );
  }

  function handleConfirm() {
    if (!address && !lat) {
      alert("Please select a location");
      return;
    }

    const draft = JSON.parse(sessionStorage.getItem("ns_complaint_draft") || "{}");
    draft.lat = lat;
    draft.lng = lng;
    draft.locationAddress = address;
    draft.ward = ward;
    sessionStorage.setItem("ns_complaint_draft", JSON.stringify(draft));

    router.push("/complaint/new/review");
  }

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", minHeight: "100vh", paddingBottom: 40 }}>
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
          <h1 style={{ fontSize: "1.1rem", fontWeight: 700, margin: 0 }}>Pin Location</h1>
          <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.8rem", margin: 0 }}>
            Step 2 of 3 — Location
          </p>
        </div>
      </div>

      {/* Progress */}
      <div style={{ padding: "12px 20px 0" }}>
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: "66%" }} />
        </div>
      </div>

      <div style={{ padding: "16px 20px" }}>
        {/* GPS Button */}
        <button
          id="use-gps-btn"
          onClick={useCurrentLocation}
          disabled={locating}
          style={{
            width: "100%",
            padding: "12px",
            background: "rgba(56,189,248,0.1)",
            border: "1px solid rgba(56,189,248,0.3)",
            borderRadius: 12,
            color: "#38bdf8",
            fontWeight: 600,
            fontSize: "0.9rem",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginBottom: 16,
            fontFamily: "DM Sans, sans-serif",
          }}
        >
          <Navigation size={16} />
          {locating ? "Getting location..." : "📍 Use My Current Location"}
        </button>

        {/* Map */}
        <div className="map-container" style={{ marginBottom: 16 }}>
          {mapsLoaded ? (
            <div ref={mapRef} style={{ width: "100%", height: "100%" }} />
          ) : (
            <div
              style={{
                width: "100%",
                height: "100%",
                background: "rgba(15,32,64,0.8)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 12,
              }}
            >
              <MapPin size={32} color="rgba(255,186,8,0.5)" />
              <p style={{ color: "rgba(240,244,255,0.5)", fontSize: "0.85rem", textAlign: "center" }}>
                Google Maps requires API key.
                <br />
                Using GPS coordinates instead.
              </p>
              <button
                onClick={useCurrentLocation}
                style={{
                  background: "rgba(255,186,8,0.15)",
                  border: "1px solid rgba(255,186,8,0.3)",
                  borderRadius: 10,
                  padding: "8px 16px",
                  color: "#ffba08",
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  fontFamily: "DM Sans, sans-serif",
                }}
              >
                📍 Get My Coordinates
              </button>
            </div>
          )}
        </div>

        <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.4)", marginBottom: 16, textAlign: "center" }}>
          {mapsLoaded ? "Drag the pin or tap on the map to set location" : ""}
        </p>

        {/* Address display */}
        {address && (
          <div
            style={{
              padding: "14px 16px",
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              marginBottom: 16,
              display: "flex",
              gap: 10,
              alignItems: "flex-start",
            }}
          >
            <MapPin size={16} color="#ffba08" style={{ flexShrink: 0, marginTop: 2 }} />
            <div>
              <p style={{ fontSize: "0.78rem", color: "rgba(240,244,255,0.45)", marginBottom: 2 }}>
                DETECTED ADDRESS
              </p>
              <p style={{ fontSize: "0.9rem", color: "#f0f4ff", lineHeight: 1.4 }}>{address}</p>
              <p style={{ fontSize: "0.75rem", color: "rgba(240,244,255,0.4)", marginTop: 4 }}>
                GPS: {lat.toFixed(5)}, {lng.toFixed(5)}
              </p>
            </div>
          </div>
        )}

        {/* Ward input */}
        <div className="form-group">
          <label className="form-label">Ward / Zone (Optional)</label>
          <input
            id="ward-input"
            className="input-field"
            placeholder="e.g., Ward 24, Zone A"
            value={ward}
            onChange={e => setWard(e.target.value)}
          />
        </div>

        {/* Manual address */}
        {!address && (
          <div className="form-group">
            <label className="form-label">Type Address</label>
            <input
              id="address-input"
              className="input-field"
              placeholder="Enter the complaint location address..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              onBlur={() => setAddress(searchQuery)}
            />
          </div>
        )}

        <button
          id="confirm-location-btn"
          className="btn-primary"
          onClick={handleConfirm}
          style={{ marginTop: 8 }}
        >
          ✅ Confirm Location & Continue →
        </button>
      </div>
    </main>
  );
}
