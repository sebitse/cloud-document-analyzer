import { useState } from "react";
import {
  getUploadUrl,
  uploadFileToS3,
  analyzeDocument,
  getHistory,
} from "./services/api";
import "./App.css";

const MAX_FILE_SIZE_MB = 5;

function App() {
  const [selectedFile, setSelectedFile] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [history, setHistory] = useState([]);
  const [message, setMessage] = useState("Ready to analyze a document.");
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState("idle");
  const [lastResult, setLastResult] = useState(null);

  function validateFile(file) {
    if (!file) {
      return "Please select a document first.";
    }

    const allowedTypes = ["image/png", "image/jpeg", "application/pdf"];

    if (!allowedTypes.includes(file.type)) {
      return "Invalid file type. Please upload a PNG, JPG, JPEG or PDF document.";
    }

    const maxSizeBytes = MAX_FILE_SIZE_MB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      return `File is too large. Maximum allowed size is ${MAX_FILE_SIZE_MB} MB.`;
    }

    return null;
  }

  function formatFileSize(bytes) {
    if (!bytes) return "0 KB";
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  }

  async function handleAnalyze() {
    const validationError = validateFile(selectedFile);

    if (validationError) {
      setMessage(validationError);
      return;
    }

    try {
      setLoading(true);
      setExtractedText("");
      setLastResult(null);

      setActiveStep("upload-url");
      setMessage("Requesting a secure upload URL from AWS Lambda...");
      const uploadData = await getUploadUrl(selectedFile);

      setActiveStep("upload");
      setMessage("Uploading the document directly to Amazon S3...");
      await uploadFileToS3(uploadData.uploadUrl, selectedFile);

      setActiveStep("analyze");
      setMessage("Analyzing the document with Amazon Textract...");
      const result = await analyzeDocument(uploadData.key, selectedFile.name);

      setActiveStep("completed");
      setExtractedText(result.extractedText || "");
      setLastResult(result);
      setMessage("Document analyzed successfully.");

      await handleLoadHistory(true);
    } catch (error) {
      console.error(error);
      setActiveStep("error");
      setMessage("An error occurred. Check the browser console or CloudWatch logs.");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadHistory(silent = false) {
    try {
      if (!silent) {
        setMessage("Loading analysis history from DynamoDB...");
      }

      const items = await getHistory();
      setHistory(items || []);

      if (!silent) {
        setMessage("History loaded successfully.");
      }
    } catch (error) {
      console.error(error);
      setMessage("Could not load history.");
    }
  }

  async function handleCopyText() {
    if (!extractedText) {
      setMessage("There is no extracted text to copy yet.");
      return;
    }

    await navigator.clipboard.writeText(extractedText);
    setMessage("Extracted text copied to clipboard.");
  }

  const steps = [
    { id: "upload-url", label: "Upload URL" },
    { id: "upload", label: "S3 Upload" },
    { id: "analyze", label: "Textract OCR" },
    { id: "completed", label: "Saved" },
  ];

  return (
    <main className="app-shell">
      <section className="hero">
        <div>
          <span className="eyebrow">AWS Serverless OCR Application</span>
          <h1>Cloud Document Analyzer</h1>
          <p>
            Upload a document, store it securely in Amazon S3, extract text with
            Amazon Textract, and save the result in DynamoDB.
          </p>
        </div>

        <div className="hero-badge">
          <span>Live AWS Backend</span>
          <strong>API Gateway + Lambda</strong>
        </div>
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <span>Cloud Services</span>
          <strong>7+</strong>
          <p>API Gateway, Lambda, S3, Textract, DynamoDB, CloudWatch</p>
        </div>

        <div className="stat-card">
          <span>AI Component</span>
          <strong>Textract</strong>
          <p>Managed OCR service for text extraction from documents</p>
        </div>

        <div className="stat-card">
          <span>Storage</span>
          <strong>S3 + DB</strong>
          <p>Documents in S3, analysis results in DynamoDB</p>
        </div>
      </section>

      <section className="main-grid">
        <div className="panel upload-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Step 1</span>
              <h2>Upload document</h2>
            </div>
            <span className={`status-pill ${activeStep === "error" ? "error" : ""}`}>
              {loading ? "Processing" : activeStep === "completed" ? "Completed" : "Ready"}
            </span>
          </div>

          <label className="drop-zone">
            <input
              type="file"
              accept=".png,.jpg,.jpeg,.pdf"
              onChange={(event) => {
                setSelectedFile(event.target.files[0]);
                setMessage("Document selected. Ready to upload.");
                setActiveStep("idle");
              }}
            />

            <div className="drop-icon">📄</div>

            {selectedFile ? (
              <>
                <strong>{selectedFile.name}</strong>
                <span>{formatFileSize(selectedFile.size)} • {selectedFile.type}</span>
              </>
            ) : (
              <>
                <strong>Choose a document</strong>
                <span>PNG, JPG, JPEG or PDF • max {MAX_FILE_SIZE_MB} MB</span>
              </>
            )}
          </label>

          <div className="actions">
            <button onClick={handleAnalyze} disabled={loading}>
              {loading ? "Analyzing..." : "Upload and Analyze"}
            </button>

            <button className="secondary" onClick={() => handleLoadHistory(false)}>
              Load History
            </button>
          </div>

          <div className="pipeline">
            {steps.map((step) => (
              <div
                key={step.id}
                className={`pipeline-step ${
                  activeStep === step.id ? "active" : ""
                } ${activeStep === "completed" ? "done" : ""}`}
              >
                <div className="dot" />
                <span>{step.label}</span>
              </div>
            ))}
          </div>

          <p className={`message ${activeStep === "error" ? "error" : ""}`}>
            {message}
          </p>
        </div>

        <div className="panel result-panel">
          <div className="panel-header">
            <div>
              <span className="section-label">Step 2</span>
              <h2>Extracted text</h2>
            </div>

            <button className="ghost" onClick={handleCopyText}>
              Copy text
            </button>
          </div>

          {lastResult && (
            <div className="result-meta">
              <span>{lastResult.fileName}</span>
              <span>{lastResult.status}</span>
              <span>{lastResult.createdAt}</span>
            </div>
          )}

          <textarea
            value={extractedText}
            readOnly
            placeholder="The extracted text will appear here after the document is analyzed..."
          />
        </div>
      </section>

      <section className="panel history-panel">
        <div className="panel-header">
          <div>
            <span className="section-label">Step 3</span>
            <h2>Analysis history</h2>
          </div>

          <span className="history-count">{history.length} records</span>
        </div>

        {history.length === 0 ? (
          <div className="empty-state">
            <strong>No history loaded yet.</strong>
            <p>Click “Load History” to retrieve previous analyses from DynamoDB.</p>
          </div>
        ) : (
          <div className="history-grid">
            {history.map((item) => (
              <article className="history-card" key={item.analysisId}>
                <div className="history-card-header">
                  <strong>{item.fileName}</strong>
                  <span>{item.status}</span>
                </div>

                <p className="date">{item.createdAt}</p>
                <p className="preview">{item.extractedText?.slice(0, 220)}...</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;