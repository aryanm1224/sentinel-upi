"use client";

import React, { useState } from "react";
import { 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  QrCode, 
  Receipt, 
  MessageSquareWarning, 
  Upload, 
  FileDown, 
  RefreshCw, 
  CheckCircle2, 
  XCircle 
} from "lucide-react";
import jsPDF from "jspdf";

interface AnalysisResult {
  riskLevel: "SAFE" | "SUSPICIOUS" | "CRITICAL";
  threatScore: number;
  scamType: string;
  redFlags: string[];
  safetyAdvice: string;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<"QR" | "RECEIPT" | "SMS">("RECEIPT");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);

  const [qrText, setQrText] = useState("");
  const [smsText, setSmsText] = useState("");
  const [receiptImage, setReceiptImage] = useState<string | null>(null);

  // Unicode-safe base64 helper
  const utf8ToBase64 = (str: string) => {
    return window.btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) => {
      return String.fromCharCode(parseInt(p1, 16));
    }));
  };

  const presets = {
    RECEIPT: {
      label: "Demo: Load Known Fake PhonePe Receipt",
      run: () => {
        const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="500" style="background:#0a0f1d; color:#fff; font-family:sans-serif; padding:20px;">
          <text x="20" y="40" fill="#22c55e" font-size="20">Payment Successful</text>
          <text x="20" y="80" fill="#ffffff" font-size="28">INR 5,000.00</text>
          <text x="20" y="120" fill="#94a3b8" font-size="12">Paid to: Sharma Electronics</text>
          <text x="20" y="150" fill="#94a3b8" font-size="12">UPI ID: 9876543210@paytm</text>
          <text x="20" y="180" fill="#ef4444" font-size="14">UTR: 3847291 (Invalid 7 digits)</text>
          <text x="20" y="210" fill="#64748b" font-size="11">Generated via QuickPay Faker APK</text>
        </svg>`;
        const b64 = "data:image/svg+xml;base64," + utf8ToBase64(svg);
        setReceiptImage(b64);
        triggerAnalysis("RECEIPT", undefined, b64);
      }
    },
    QR: {
      label: "Demo: Load 'Scan to Receive' Scam String",
      run: () => {
        const payload = "upi://pay?pa=scammer.merchant@okaxis&pn=RefundDesk_Official&am=2500&cu=INR&tn=Scan+to+receive+cashback+reward";
        setQrText(payload);
        triggerAnalysis("QR_LINK", payload);
      }
    },
    SMS: {
      label: "Demo: Load Urgent Electricity Cutoff Scam",
      run: () => {
        const payload = "Dear consumer, electricity power will be disconnected tonight 9:30 PM from electricity office because your previous month bill was not updated. Please immediately call officer at 9821098210.";
        setSmsText(payload);
        triggerAnalysis("SMS", payload);
      }
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const b64 = reader.result as string;
      setReceiptImage(b64);
      triggerAnalysis("RECEIPT", undefined, b64);
    };
    reader.readAsDataURL(file);
  };

  const triggerAnalysis = async (type: string, text?: string, image?: string) => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          textContent: text,
          imageBase64: image
        })
      });
      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const downloadPDFReport = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("SENTINEL-UPI FORENSIC AUDIT REPORT", 20, 25);
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 20, 35);
    doc.text(`Threat Score: ${result.threatScore} / 100`, 20, 45);
    doc.text(`Risk Assessment: ${result.riskLevel}`, 20, 55);
    doc.text(`Identified Pattern: ${result.scamType}`, 20, 65);
    
    doc.setFont("helvetica", "bold");
    doc.text("Detected Vulnerabilities & Forensic Red Flags:", 20, 80);
    doc.setFont("helvetica", "normal");
    
    let y = 90;
    (result.redFlags || []).forEach((flag, idx) => {
      doc.text(`${idx + 1}. ${flag}`, 25, y);
      y += 10;
    });

    doc.setFont("helvetica", "bold");
    doc.text("Prescribed Safety Action:", 20, y + 10);
    doc.setFont("helvetica", "normal");
    doc.text(result.safetyAdvice || "Follow standard digital payment safety guidelines.", 20, y + 20, { maxWidth: 170 });

    doc.save("SentinelUPI_Forensic_Report.pdf");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans">
      <header className="w-full max-w-5xl flex items-center justify-between pb-6 border-b border-slate-800">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl">
            <ShieldAlert className="w-7 h-7 text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
              Sentinel<span className="text-blue-500">UPI</span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                Affecio Hacks &apos;26
              </span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Autonomous Real-Time UPI &amp; Social Engineering Interceptor
            </p>
          </div>
        </div>
        <div className="hidden sm:flex items-center gap-3">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-mono text-slate-400">Engine Online</span>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-8 mt-8">
        <section className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
            <button
              onClick={() => { setActiveTab("RECEIPT"); setResult(null); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === "RECEIPT"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Receipt className="w-4 h-4" /> Receipt Forensics
            </button>
            <button
              onClick={() => { setActiveTab("QR"); setResult(null); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === "QR"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <QrCode className="w-4 h-4" /> QR &amp; Intent Link
            </button>
            <button
              onClick={() => { setActiveTab("SMS"); setResult(null); }}
              className={`flex-1 py-2.5 px-3 rounded-lg text-xs md:text-sm font-medium flex items-center justify-center gap-2 transition-all ${
                activeTab === "SMS"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <MessageSquareWarning className="w-4 h-4" /> Scam SMS
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <div className="mb-6 flex justify-between items-center bg-blue-950/30 border border-blue-800/40 p-3 rounded-xl">
              <span className="text-xs text-blue-300 font-medium">Evaluation Demo Mode:</span>
              <button
                onClick={presets[activeTab].run}
                className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg font-medium transition flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                {presets[activeTab].label}
              </button>
            </div>

            {activeTab === "RECEIPT" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-300">
                  Upload Payment Screenshot or Receipt
                </label>
                <div className="border-2 border-dashed border-slate-700 hover:border-blue-500/50 rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition relative bg-slate-950/40">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Upload className="w-10 h-10 text-slate-500 mb-2" />
                  <p className="text-sm text-slate-300 font-medium">
                    Drag and drop or click to upload
                  </p>
                  <p className="text-xs text-slate-500 mt-1">PNG, JPG, or Screenshots</p>
                </div>
                {receiptImage && (
                  <div className="mt-2 p-2 bg-slate-950 rounded-lg border border-slate-800 flex items-center justify-between">
                    <span className="text-xs text-slate-400 truncate max-w-xs">Receipt Loaded</span>
                    <button
                      onClick={() => triggerAnalysis("RECEIPT", undefined, receiptImage)}
                      className="text-xs bg-blue-600 px-3 py-1 rounded text-white"
                    >
                      Re-Analyze
                    </button>
                  </div>
                )}
              </div>
            )}

            {activeTab === "QR" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-300">
                  Paste UPI Intent Link or Scanned QR String
                </label>
                <input
                  type="text"
                  value={qrText}
                  onChange={(e) => setQrText(e.target.value)}
                  placeholder="e.g. upi://pay?pa=name@bank&pn=Merchant&am=1000..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm font-mono text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  disabled={!qrText || loading}
                  onClick={() => triggerAnalysis("QR_LINK", qrText)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Audit UPI String"}
                </button>
              </div>
            )}

            {activeTab === "SMS" && (
              <div className="flex flex-col gap-4">
                <label className="text-sm font-medium text-slate-300">
                  Paste Suspicious SMS or Coercive WhatsApp Message
                </label>
                <textarea
                  rows={4}
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                  placeholder="e.g. Electricity disconnected tonight... call immediately..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-blue-500"
                />
                <button
                  disabled={!smsText || loading}
                  onClick={() => triggerAnalysis("SMS", smsText)}
                  className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition flex items-center justify-center gap-2"
                >
                  {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Analyze Threat Urgency"}
                </button>
              </div>
            )}
          </div>
        </section>

        <section className="lg:col-span-5">
          {loading && (
            <div className="h-full min-h-[420px] bg-slate-900/40 border border-slate-800 rounded-2xl flex flex-col items-center justify-center p-8 text-center animate-pulse">
              <RefreshCw className="w-10 h-10 text-blue-500 animate-spin mb-4" />
              <p className="text-base font-medium text-slate-200">Executing Deep Forensic Inspection...</p>
              <p className="text-xs text-slate-500 mt-2">Checking typography, RBI 12-digit UTR integrity, and coercive patterns</p>
            </div>
          )}

          {!loading && !result && (
            <div className="h-full min-h-[420px] bg-slate-900/40 border border-slate-800/60 rounded-2xl flex flex-col items-center justify-center p-8 text-center">
              <ShieldCheck className="w-12 h-12 text-slate-700 mb-3" />
              <h3 className="text-base font-semibold text-slate-400">Awaiting Input Data</h3>
              <p className="text-xs text-slate-600 max-w-xs mt-1">
                Upload a payment screenshot, enter a UPI intent link, or test with one of the evaluation presets.
              </p>
            </div>
          )}

          {!loading && result && (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 flex flex-col gap-5 shadow-2xl relative overflow-hidden">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  {result.riskLevel === "CRITICAL" && (
                    <div className="p-2 bg-red-500/10 border border-red-500/30 rounded-lg">
                      <XCircle className="w-6 h-6 text-red-400" />
                    </div>
                  )}
                  {result.riskLevel === "SUSPICIOUS" && (
                    <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                      <AlertTriangle className="w-6 h-6 text-amber-400" />
                    </div>
                  )}
                  {result.riskLevel === "SAFE" && (
                    <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg">
                      <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                    </div>
                  )}
                  <div>
                    <span className="text-xs font-mono uppercase text-slate-400">Risk Assessment</span>
                    <h2 className="text-lg font-bold text-white leading-none">{result.riskLevel}</h2>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono uppercase text-slate-400">Threat Index</span>
                  <p className={`text-2xl font-black font-mono leading-none ${
                    result.threatScore > 70 ? "text-red-400" : result.threatScore > 30 ? "text-amber-400" : "text-emerald-400"
                  }`}>
                    {result.threatScore}<span className="text-xs text-slate-500">/100</span>
                  </p>
                </div>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400">Classified Threat Vector:</span>
                <p className="text-sm font-semibold text-slate-200 mt-0.5">{result.scamType}</p>
              </div>

              <div>
                <span className="text-xs font-mono text-slate-400">Forensic Red Flags Detected:</span>
                <ul className="mt-2 flex flex-col gap-2">
                  {(result.redFlags || []).map((flag, idx) => (
                    <li key={idx} className="text-xs bg-slate-950 border border-slate-800 p-2.5 rounded-lg flex items-start gap-2 text-slate-300">
                      <span className="text-red-400 font-bold">•</span>
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-3.5 bg-blue-950/20 border border-blue-800/30 rounded-xl">
                <span className="text-xs font-semibold text-blue-400 block mb-1">Prescribed Action:</span>
                <p className="text-xs text-slate-300 leading-relaxed">{result.safetyAdvice}</p>
              </div>

              <button
                onClick={downloadPDFReport}
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium py-3 rounded-xl transition flex items-center justify-center gap-2 mt-2"
              >
                <FileDown className="w-4 h-4" /> Download Signed Audit Report (PDF)
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}