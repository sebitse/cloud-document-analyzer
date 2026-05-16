function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function mockGetUploadUrl(file) {
  await wait(700);

  return {
    uploadUrl: "mock-upload-url",
    key: `uploads/mock-${Date.now()}-${file.name}`,
    bucket: "mock-document-bucket",
  };
}

export async function mockUploadFileToS3(uploadUrl, file) {
  await wait(900);

  return {
    success: true,
    fileName: file.name,
  };
}

export async function mockAnalyzeDocument(key, fileName) {
  await wait(1300);

  return {
    analysisId: crypto.randomUUID(),
    fileName,
    s3Key: key,
    status: "COMPLETED",
    createdAt: new Date().toISOString(),
    extractedText:
      "Cloud Document Analyzer\n\n" +
      "This is a mock extracted text generated for frontend testing.\n" +
      "Amazon Textract will later replace this mocked response.\n\n" +
      "Example fields:\n" +
      "Invoice Number: 12345\n" +
      "Total: 250 RON\n" +
      "Date: 16.05.2026",
  };
}

export async function mockGetHistory() {
  await wait(600);

  return [
    {
      analysisId: "mock-1",
      fileName: "invoice-sample.png",
      createdAt: "2026-05-16T10:30:00Z",
      status: "COMPLETED",
      extractedText: "Invoice Number: 12345\nTotal: 250 RON",
    },
    {
      analysisId: "mock-2",
      fileName: "romanian-document.png",
      createdAt: "2026-05-15T18:20:00Z",
      status: "COMPLETED",
      extractedText: "Bună ziua!\nAcesta este un document de test.",
    },
  ];
}
