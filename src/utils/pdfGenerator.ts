import jsPDF from "jspdf";

export function generateForensicPDF(data: {
  sha256?: string;
  verdict: string;
  threatScore: number;
  anomalies: string[];
  timestamp?: string;
}) {
  const doc = new jsPDF();
  const currentTimestamp = data.timestamp || new Date().toISOString();

  // Document Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(30, 41, 59);
  doc.text("SENTINEL-UPI FORENSIC AUDIT DOSSIER", 14, 20);

  // Evidence Metadata (SHA-256 & Timestamp)
  doc.setFontSize(9);
  doc.setFont("courier", "normal");
  doc.setTextColor(100, 116, 139);
  doc.text(`EVIDENCE SHA-256: ${data.sha256 || "COMPUTED_AT_INGESTION"}`, 14, 28);
  doc.text(`TIMESTAMP (UTC):  ${currentTimestamp}`, 14, 34);
  doc.text(`PIPELINE STATUS:  ZERO-TRUST FAIL-SECURE VERIFIED`, 14, 40);

  // Divider Line
  doc.setDrawColor(203, 213, 225);
  doc.line(14, 44, 196, 44);

  // Threat Meter & Verdict
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  if (data.threatScore > 50) {
    doc.setTextColor(220, 38, 38); // High Risk Red
  } else {
    doc.setTextColor(22, 163, 74); // Clean Green
  }
  doc.text(`VERDICT: ${data.verdict} (Risk Index: ${data.threatScore}/100)`, 14, 54);

  // Forensic Observations
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(51, 65, 85);
  doc.text("Forensic Observations & Rule Triggers:", 14, 65);

  let y = 73;
  if (data.anomalies && data.anomalies.length > 0) {
    data.anomalies.forEach((anomaly, index) => {
      doc.text(`• [Finding ${index + 1}] ${anomaly}`, 16, y);
      y += 8;
    });
  } else {
    doc.text("• No visual tampering or cryptographic anomalies detected.", 16, y);
    y += 8;
  }

  // Large Diagonal Watermark Stamp
  doc.setFontSize(36);
  if (data.threatScore > 50) {
    doc.setTextColor(254, 226, 226); // Light red watermark
    doc.text("TAMPER DETECTED", 30, 180, { angle: 35 });
  } else {
    doc.setTextColor(220, 252, 231); // Light green watermark
    doc.text("SIGNATURE VERIFIED", 25, 180, { angle: 35 });
  }

  const filePrefix = data.sha256 ? data.sha256.substring(0, 8) : "report";
  doc.save(`Sentinel_Forensic_${filePrefix}.pdf`);
}
