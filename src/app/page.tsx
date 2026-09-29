"use client";

import React, { useState, useRef } from "react";
import { Shield, ShieldAlert, CheckCircle2, AlertTriangle, FileDown, Eye, Upload, RefreshCw, Zap } from "lucide-react";
import { computeSHA256, generateELACanvas } from "@/utils/forensics";
import { generateForensicPDF } from "@/utils/pdfGenerator";

interface ForensicResult {
  threatScore: number;
  verdict: string;
  anomaliesDetected?: string[];
  fontKerningMatch?: boolean;
  checksumVerified?: boolean;
  confidenceScore?: number;
  uriAudit?: {
    isValid: boolean;
    vpa: string;
    payeeName: string;
    amount: string;
    flags: string[];
  } | null;
}

export default function Home() {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [sha256Hash, setSha256Hash] = useState<string>("");
  const [rawUriInput, setRawUriInput] = useState<string>("");
  const [analyzing, setAnalyzing] = useState<boolean>(false);
  const [result, setResult] = useState<ForensicResult | null>(null);
  const [showELA, setShowELA] = useState<boolean>(false);
  const [cooldown, setCooldown] = useState<boolean>(false);

  const imgRef = useRef<HTMLImageElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Ingestion handler: computes SHA-256 and sets preview
  const processFile = async (file: File) => {
    setImageFile(file);
    setResult(null);
    setShowELA(false);

    const hash = await computeSHA256(file);
    setSha256Hash(hash);

    const reader = new FileReader();
    reader.onload = (e) => {
      setSelectedImage(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // 1-Click Forensic Sandbox (Demo mode)
  const loadDemoSample = (isForgery: boolean) => {
    setResult(null);
    setShowELA(false);

    // Dynamic mock canvas receipt to avoid static asset dependencies
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 800;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, 600, 800);

    // Header bar
    ctx.fillStyle = isForgery ? "#002e6e" : "#5f259f";
    ctx.fillRect(0, 0, 600, 120);

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 28px sans-serif";
    ctx.fillText(isForgery ? "PAYMENT SUCCESSFUL" : "TRANSACTION SUCCESSFUL", 40, 75);

    // Body content
    ctx.fillStyle = "#1e293b";
    ctx.font = isForgery ? "bold 44px 'Courier New'" : "bold 40px sans-serif";
    ctx.fillText("INR 25,000.00", 40, 240);

    ctx.font = "18px sans-serif";
    ctx.fillStyle = "#64748b";
    ctx.fillText("Paid to: Merchant Store", 40, 300);
    ctx.fillText(isForgery ? "Ref: 998877" : "UPI Ref: 426819284719", 40, 340);
    ctx.fillText("Date: 29 Sep 2026, 02:15 PM", 40, 380);

    if (isForgery) {
      // Intentional artifact mismatch box (simulating edited area)
      ctx.fillStyle = "rgba(239, 68, 68, 0.15)";
      ctx.fillRect(35, 195, 340, 60);
    }

    canvas.toBlob(async (blob) => {
      if (blob) {
        const file = new File(
          [blob],
          isForgery ? "spoofpe_sample_forgery.jpg" : "axis_genuine_receipt.jpg",
          { type: "image/jpeg" }
        );
        processFile(file);
      }
    }, "image/jpeg", 0.92);
  };

  // Run full forensic pipeline
  const runAnalysis = async () => {
    if (cooldown || analyzing) return;
    if (!selectedImage && !rawUriInput) return;

    setAnalyzing(true);
    setCooldown(true);

    try {
      const payload: any = {};
      if (selectedImage) {
        payload.imageBase64 = selectedImage;
        payload.mimeType = imageFile?.type || "image/jpeg";
      }
      if (rawUriInput.trim()) {
        payload.rawUri = rawUriInput.trim();
      }

      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: ForensicResult = await response.json();
      setResult(data);

      // Trigger ELA generation if image present
      if (imgRef.current && canvasRef.current) {
        generateELACanvas(imgRef.current, canvasRef.current);
      }
    } catch {
      setResult({
        threatScore: 80,
        verdict: "ANALYSIS FAILURE / FAIL-SECURE ACTIVE",
        anomaliesDetected: ["Network error encountered. Transaction unverified."],
      });
    } finally {
      setAnalyzing(false);
      // 5-second cooldown guardrail
      setTimeout(() => setCooldown(false), 5000);
    }
  };

  const handleDownloadPDF = () => {
    if (!result) return;
    generateForensicPDF({
      sha256: sha256Hash,
      verdict: result.verdict,
      threatScore: result.threatScore,
      anomalies: result.anomaliesDetected || [],
      timestamp: new Date().toISOString(),
    });
  };

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center px-4 py-12">
      {/* Header */}
      <header className="max-w-4xl w-full text-center mb-10">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-950/60 border border-indigo-700/40 text-indigo-400 text-xs font-mono uppercase tracking-wider mb-4">
          <Shield className="w-3.5 h-3.5" />
          Enterprise-Grade Forensic Sandbox
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          Sentinel-UPI
        </h1>
        <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
          Client-side Error Level Analysis (ELA), NPCI deep-link protocol validation, and multimodal forgery verification.
        </p>
      </header>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Ingestion Column */}
        <section className="flex flex-col gap-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <Upload className="w-4 h-4 text-indigo-400" />
            Evidence Ingestion
          </h2>

          {/* Upload Dropzone */}
          <label className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer transition bg-slate-950/40 min-h-[200px]">
            <input type="file" accept="image/*" onChange={handleFileInput} className="hidden" />
            <Upload className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-medium text-slate-200">Upload Receipt Screenshot</span>
            <span className="text-xs text-slate-500 mt-1">PNG, JPG, or WEBP</span>
          </label>

          {/* 1-Click Forensic Sandbox Buttons */}
          <div className="flex flex-col gap-2 pt-1 border-t border-slate-800/80">
            <span className="text-xs font-mono text-slate-400">1-Click Sandbox Test:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => loadDemoSample(true)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-red-950/40 border border-red-800/60 text-red-300 hover:bg-red-900/60 transition flex items-center justify-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 text-red-400" />
                SpoofPe Sample
              </button>
              <button
                type="button"
                onClick={() => loadDemoSample(false)}
                className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-emerald-300 hover:bg-emerald-900/60 transition flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                Authentic Sample
              </button>
            </div>
          </div>

          {/* Deep Link Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-mono text-slate-400">Raw UPI Deep-Link / QR String (Optional):</label>
            <input
              type="text"
              placeholder="upi://pay?pa=merchant@upi&pn=Store..."
              value={rawUriInput}
              onChange={(e) => setRawUriInput(e.target.value)}
              className="px-3 py-2 text-xs rounded-lg bg-slate-950 border border-slate-800 focus:border-indigo-500 focus:outline-none text-slate-200"
            />
          </div>

          {/* SHA-256 Digest Tag */}
          {sha256Hash && (
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 font-mono text-[10px] break-all text-slate-400">
              <span className="text-indigo-400 font-bold block mb-0.5">SHA-256 Evidence Digest:</span>
              {sha256Hash}
            </div>
          )}

          {/* Execute Button */}
          <button
            onClick={runAnalysis}
            disabled={(!selectedImage && !rawUriInput) || analyzing || cooldown}
            className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-500 font-semibold text-sm transition flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/20"
          >
            {analyzing ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Inspecting Kerning & Micro-Patterns...
              </>
            ) : cooldown ? (
              "Pipeline Cooldown (5s)..."
            ) : (
              <>
                <Shield className="w-4 h-4" />
                Run Zero-Trust Forensic Audit
              </>
            )}
          </button>
        </section>

        {/* Inspection & Results Column */}
        <section className="flex flex-col gap-5 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Eye className="w-4 h-4 text-indigo-400" />
              Forensic Viewport
            </h2>
            {selectedImage && (
              <button
                type="button"
                onClick={() => setShowELA(!showELA)}
                className="text-xs px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono transition"
              >
                {showELA ? "Show Original View" : "Toggle ELA Heatmap"}
              </button>
            )}
          </div>

          {/* Canvas & Image Workspace */}
          <div className="relative w-full aspect-[3/4] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden flex items-center justify-center">
            {selectedImage ? (
              <>
                {/* Visible DOM Image */}
                <img
                  ref={imgRef}
                  src={selectedImage}
                  alt="Receipt Evidence"
                  className={`w-full h-full object-contain ${showELA ? "hidden" : "block"}`}
                  onLoad={() => {
                    if (canvasRef.current && imgRef.current) {
                      generateELACanvas(imgRef.current, canvasRef.current);
                    }
                  }}
                />
                {/* ELA Heatmap Canvas */}
                <canvas
                  ref={canvasRef}
                  className={`w-full h-full object-contain ${showELA ? "block" : "hidden"}`}
                />
              </>
            ) : (
              <div className="text-xs text-slate-500 font-mono text-center p-4">
                No evidence loaded. Upload a receipt or select a sandbox sample.
              </div>
            )}
          </div>

          {/* Results Summary Box */}
          {result && (
            <div className="flex flex-col gap-3 p-4 rounded-xl bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-400">Threat Index:</span>
                <span
                  className={`text-sm font-bold font-mono ${
                    result.threatScore > 50 ? "text-red-400" : "text-emerald-400"
                  }`}
                >
                  {result.threatScore} / 100 ({result.verdict})
                </span>
              </div>

              {result.anomaliesDetected && result.anomaliesDetected.length > 0 && (
                <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-mono text-slate-400 block">Flagged Discrepancies:</span>
                  {result.anomaliesDetected.map((anomaly, idx) => (
                    <div key={idx} className="text-xs text-slate-300 flex items-start gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                      <span>{anomaly}</span>
                    </div>
                  ))}
                </div>
              )}

              {result.uriAudit && result.uriAudit.flags.length > 0 && (
                <div className="space-y-1 pt-2 border-t border-slate-800/80">
                  <span className="text-xs font-mono text-red-400 block">URI Trap Flags:</span>
                  {result.uriAudit.flags.map((flag, idx) => (
                    <div key={idx} className="text-xs text-red-300 flex items-start gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </div>
                  ))}
                </div>
              )}

              <button
                type="button"
                onClick={handleDownloadPDF}
                className="mt-2 w-full py-2.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold font-mono flex items-center justify-center gap-2 transition"
              >
                <FileDown className="w-4 h-4 text-indigo-400" />
                Export Certified Audit Report (.PDF)
              </button>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
