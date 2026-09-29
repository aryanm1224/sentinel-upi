import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Strict NPCI Specification UPI Deep-Link Validator
function validateUPILink(uriString: string) {
  try {
    const url = new URL(uriString.trim());
    if (url.protocol !== "upi:") {
      return { isValid: false, flags: ["Invalid protocol: Must start with upi://"] };
    }

    const params = url.searchParams;
    const pa = params.get("pa"); // Payee VPA
    const pn = params.get("pn"); // Payee Name
    const am = params.get("am"); // Amount
    const mc = params.get("mc"); // Merchant Category Code
    const mode = params.get("mode");

    const flags: string[] = [];

    // Phishing & Spoofed Handle Pattern Matching
    if (!pa) {
      flags.push("CRITICAL: Missing Payee VPA (pa parameter).");
    } else {
      const suspiciousHandles = ["merchanthdfc@ybl", "paytmofficial@okaxis", "supportupi@okicici"];
      if (suspiciousHandles.some((h) => pa.toLowerCase().includes(h))) {
        flags.push(`HIGH RISK: Payee handle '${pa}' matches known spoofing pattern.`);
      }
    }

    // Collect Trap Detection
    if (mode === "02" || mode === "04") {
      flags.push("TRAP ALERT: Mandate/Collect mode active. This requests funds from you rather than paying.");
    }

    // High-Value Merchant Check
    if (am && parseFloat(am) > 2000 && !mc) {
      flags.push("ANOMALY: High transaction amount requested without verified Merchant Category Code (mc).");
    }

    return {
      isValid: flags.length === 0,
      vpa: pa || "N/A",
      payeeName: pn || "N/A",
      amount: am || "Variable",
      flags,
    };
  } catch {
    return { isValid: false, flags: ["Malformed URI format."] };
  }
}

export async function POST(req: NextRequest) {
  try {
    const { imageBase64, mimeType, rawUri } = await req.json();

    let uriAnalysis = null;
    if (rawUri) {
      uriAnalysis = validateUPILink(rawUri);
    }

    if (!imageBase64) {
      return NextResponse.json({
        threatScore: uriAnalysis && !uriAnalysis.isValid ? 85 : 10,
        verdict: uriAnalysis && !uriAnalysis.isValid ? "SUSPICIOUS QR PARAMETERS" : "CLEAN",
        uriAudit: uriAnalysis,
        breakdown: uriAnalysis?.flags || ["No image provided; URI evaluated."],
      });
    }

    // 8-Second Fail-Secure Timeout Guardrail
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("TIMEOUT_EXCEEDED")), 8000)
    );

    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = `You are an automated digital forensics inspector specializing in Indian UPI payment receipts.
Analyze this image for:
1. Mismatched font baselines or altered typography (SpoofPe, Paytm fake APKs).
2. Sub-pixel artifact halos around the transaction amount or reference ID.
3. Invalid or corrupted NPCI UTR reference numbers.
4. Timestamp logic mismatches.

Return ONLY strict valid JSON in this exact structure:
{
  "threatScore": number (0 to 100),
  "verdict": "GENUINE" | "TAMPERED / FORGERY" | "HIGH RISK ANOMALY",
  "anomaliesDetected": string[],
  "fontKerningMatch": boolean,
  "checksumVerified": boolean,
  "confidenceScore": number (0 to 100)
}`;

    const analyzePromise = model.generateContent([
      prompt,
      {
        inlineData: {
          data: imageBase64.replace(/^data:image\/\w+;base64,/, ""),
          mimeType: mimeType || "image/jpeg",
        },
      },
    ]);

    const result: any = await Promise.race([analyzePromise, timeoutPromise]);
    const responseText = result.response.text();
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsedData = JSON.parse(cleanJson);

    return NextResponse.json({
      ...parsedData,
      uriAudit: uriAnalysis,
    });
  } catch (error: any) {
    if (error.message === "TIMEOUT_EXCEEDED") {
      return NextResponse.json({
        threatScore: 80,
        verdict: "ANALYSIS TIMEOUT / POTENTIAL TAMPER",
        anomaliesDetected: [
          "Edge verification exceeded 8000ms safety window.",
          "Fail-secure triggered: transaction marked unverified hold.",
        ],
        fontKerningMatch: false,
        checksumVerified: false,
        confidenceScore: 50,
      });
    }

    return NextResponse.json(
      { error: "Forensic pipeline error", details: error.message },
      { status: 500 }
    );
  }
}
