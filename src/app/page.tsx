"use client";

import React, { useState } from "react";
import Image from "next/image";
import {
  ShieldCheck,
  FileSearch,
  QrCode,
  MessageSquareWarning,
  Download,
  AlertTriangle,
  RotateCcw,
  UploadCloud,
  CheckCircle2,
} from "lucide-react";
import jsPDF from "jspdf";

interface ForensicResult {
  threatLevel: "SAFE" | "LOW" | "MODERATE" | "HIGH" | "CRITICAL";
  threatScore: number;
  threatVector: string;
  redFlags: string[];
  prescribedAction: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"receipt" | "intent" | "sms">("receipt");
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>("image/jpeg");
  const [intentUrl, setIntentUrl] = useState<string>("");
  const [smsText, setSmsText] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<ForensicResult | null>(null);

  // Client-side image compression: prevents Vercel 413 payload size errors
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMimeType(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1200;
        const MAX_HEIGHT = 1600;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, width, height);

        const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);
        setImageBase64(compressedDataUrl);
        setResult(null);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const loadDemo = () => {
    setActiveTab("receipt");
    setImageBase64("DEMO_MODE");
    setResult({
      threatLevel: "CRITICAL",
      threatScore: 96,
      threatVector: "Synthetic APK Overlay & UTR Checksum Failure",
      redFlags: [
        "Font kerning mismatch detected across transaction amount glyphs",
        "Fake payment generator APK UI layout pattern (SpoofPe signature)",
        "Invalid 12-digit NPCI bank reference sequence (non-existent bank routing prefix)"
      ],
      prescribedAction:
        "Decline transaction immediately. Counterfeit receipt generated via an offline payment spoofer APK."
    });
  };

  const handleAnalyze = async () => {
    if (imageBase64 === "DEMO_MODE") {
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const payload: any = { analysisType: activeTab };
      if (activeTab === "receipt") {
        if (!imageBase64) {
          alert("Please upload a receipt screenshot first.");
          setLoading(false);
          return;
        }
        payload.imageBase64 = imageBase64;
        payload.mimeType = mimeType;
      } else if (activeTab === "intent") {
        if (!intentUrl.trim()) {
          alert("Please enter a UPI intent link.");
          setLoading(false);
          return;
        }
        payload.intentUrl = intentUrl;
      } else if (activeTab === "sms") {
        if (!smsText.trim()) {
          alert("Please enter an SMS or alert message.");
          setLoading(false);
          return;
        }
        payload.smsText = smsText;
      }

      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        throw new Error("Server returned HTTP " + res.status);
      }

      const data: ForensicResult = await res.json();
      setResult(data);
    } catch (err: any) {
      console.error(err);
      alert("Analysis failed. Please ensure the backend is connected.");
    } finally {
      setLoading(false);
    }
  };

  const downloadReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("SENTINEL-UPI FORENSIC AUDIT REPORT", 20, 22);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text("Timestamp: " + new Date().toISOString(), 20, 30);
    doc.text("Threat Level: " + result.threatLevel + " (Threat Index: " + result.threatScore + "/100)", 20, 36);
    doc.text("Classified Threat Vector: " + result.threatVector, 20, 42);

    doc.line(20, 46, 190, 46);

    doc.setFont("helvetica", "bold");
    doc.text("FORENSIC RED FLAGS DETECTED:", 20, 54);
    doc.setFont("helvetica", "normal");
    let y = 62;
    result.redFlags.forEach((flag) => {
      doc.text("• " + flag, 24, y);
      y += 8;
    });

    y += 6;
    doc.setFont("helvetica", "bold");
    doc.text("PRESCRIBED MITIGATION ACTION:", 20, y);
    y += 8;
    doc.setFont("helvetica", "normal");
    const splitAction = doc.splitTextToSize(result.prescribedAction, 160);
    doc.text(splitAction, 20, y);

    doc.save("Sentinel_UPI_Forensic_Report_" + Date.now() + ".pdf");
  };

  const getThreatColor = (level?: string) => {
    switch (level) {
      case "SAFE":
      case "LOW":
        return "text-emerald-400 border-emerald-500/30 bg-emerald-500/10";
      case "MODERATE":
        return "text-yellow-400 border-yellow-500/30 bg-yellow-500/10";
      case "HIGH":
      case "CRITICAL":
      default:
        return "text-red-400 border-red-500/30 bg-red-500/10";
    }
  };

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-slate-800/80 bg-[#0c1222]/80 backdrop-blur-md px-6 py-4 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/30 flex items-center justify-center p-1 overflow-hidden">
            <Image
              src="/logo.png"
              alt="Sentinel UPI Logo"
              width={36}
              height={36}
              className="object-contain"
              priority
            />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xl font-bold tracking-tight text-white">
                Sentinel <span className="text-blue-500">UPI</span>
              </span>
              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-semibold">
                Affecio Hacks &apos;26
              </span>
            </div>
            <p className="text-xs text-slate-400">Autonomous Real-Time UPI &amp; Social Engineering Interceptor</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span className="text-xs text-slate-300 font-mono">Engine Online</span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Controls & Input */}
        <section className="lg:col-span-6 space-y-6">
          {/* Feature Tabs */}
          <div className="grid grid-cols-3 gap-2 bg-[#0c1322] p-1.5 rounded-2xl border border-slate-800">
            <button
              onClick={() => { setActiveTab("receipt"); setResult(null); }}
              className={
                "flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all " +
                (activeTab === "receipt"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40")
              }
            >
              <FileSearch className="w-4 h-4" />
              <span>Receipt Forensics</span>
            </button>
            <button
              onClick={() => { setActiveTab("intent"); setResult(null); }}
              className={
                "flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all " +
                (activeTab === "intent"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40")
              }
            >
              <QrCode className="w-4 h-4" />
              <span>QR &amp; Intent Link</span>
            </button>
            <button
              onClick={() => { setActiveTab("sms"); setResult(null); }}
              className={
                "flex items-center justify-center space-x-2 py-2.5 px-3 rounded-xl text-xs font-semibold transition-all " +
                (activeTab === "sms"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/25"
                  : "text-slate-400 hover:text-white hover:bg-slate-800/40")
              }
            >
              <MessageSquareWarning className="w-4 h-4" />
              <span>Scam SMS</span>
            </button>
          </div>

          {/* Input Panel Card */}
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-6 space-y-5">
            {activeTab === "receipt" && (
              <>
                <div className="flex items-center justify-between bg-slate-900/60 border border-slate-800 p-3 rounded-xl">
                  <span className="text-xs text-slate-400 font-medium">Evaluation Demo Mode:</span>
                  <button
                    onClick={loadDemo}
                    className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Demo: Load Known Fake PhonePe Receipt</span>
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-slate-300">Upload Payment Screenshot or Receipt</label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-xl p-8 cursor-pointer bg-slate-900/30 transition-colors">
                    <UploadCloud className="w-10 h-10 text-slate-400 mb-2" />
                    <span className="text-sm font-semibold text-slate-200">
                      {imageBase64
                        ? imageBase64 === "DEMO_MODE"
                          ? "Demo Mock Loaded"
                          : "Receipt Loaded & Compressed"
                        : "Drag and drop or click to upload"}
                    </span>
                    <span className="text-xs text-slate-500 mt-1">PNG, JPG, or Screenshots (Auto-optimized)</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                  </label>
                </div>
              </>
            )}

            {activeTab === "intent" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Paste Raw UPI Intent URL or QR Payload</label>
                <textarea
                  rows={4}
                  value={intentUrl}
                  onChange={(e) => setIntentUrl(e.target.value)}
                  placeholder="upi://pay?pa=merchant@okaxis&pn=MerchantName&am=1500&cu=INR..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            {activeTab === "sms" && (
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-300">Paste Suspicious SMS / Alert Notification</label>
                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="Dear Customer, your electricity power will be disconnected tonight at 9:30 PM. Immediately contact officer at 9876543210 to update bills..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-lg shadow-blue-600/20 transition-all flex items-center justify-center space-x-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
                  <span>Executing Multimodal Inspection...</span>
                </>
              ) : (
                <span>Analyze Threat &amp; Integrity</span>
              )}
            </button>
          </div>
        </section>

        {/* Right Column: Live Analysis Output */}
        <section className="lg:col-span-6">
          <div className="bg-[#0c1322] border border-slate-800 rounded-2xl p-6 min-h-[500px] flex flex-col justify-between">
            {result ? (
              <div className="space-y-6">
                {/* Header Verdict Card */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
                  <div>
                    <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase block">RISK ASSESSMENT</span>
                    <span className={"inline-block text-xl font-black mt-1 px-3 py-1 rounded-lg border " + getThreatColor(result.threatLevel)}>
                      {result.threatLevel}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] tracking-widest text-slate-400 font-mono uppercase block">THREAT INDEX</span>
                    <div className="text-2xl font-black font-mono text-white mt-1">
                      <span className={result.threatScore > 50 ? "text-red-400" : "text-emerald-400"}>
                        {result.threatScore}
                      </span>
                      <span className="text-slate-600 text-sm">/100</span>
                    </div>
                  </div>
                </div>

                {/* Threat Vector */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">Classified Threat Vector:</h4>
                  <p className="text-sm font-semibold text-white bg-slate-900/60 p-3 rounded-xl border border-slate-800/80">
                    {result.threatVector}
                  </p>
                </div>

                {/* Red Flags / Forensic Findings */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2">Forensic Findings:</h4>
                  <div className="space-y-2">
                    {result.redFlags.map((flag, idx) => (
                      <div key={idx} className="flex items-start space-x-2.5 bg-slate-900/40 p-2.5 rounded-xl border border-slate-800/60 text-xs text-slate-300">
                        {result.threatScore > 50 ? (
                          <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                        ) : (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        )}
                        <span>{flag}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Prescribed Action */}
                <div>
                  <h4 className="text-xs font-mono uppercase tracking-wider text-blue-400 mb-1">Prescribed Action:</h4>
                  <p className="text-xs text-slate-300 bg-blue-950/20 border border-blue-900/40 p-3 rounded-xl leading-relaxed">
                    {result.prescribedAction}
                  </p>
                </div>

                {/* PDF Export Button */}
                <button
                  onClick={downloadReport}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl border border-slate-700 transition-colors flex items-center justify-center space-x-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Signed Audit Report (PDF)</span>
                </button>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-600">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-300">Awaiting Input Data</h3>
                  <p className="text-xs text-slate-500 max-w-sm mt-1">
                    Upload a payment screenshot, enter a UPI intent link, or test with one of the evaluation presets.
                  </p>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
