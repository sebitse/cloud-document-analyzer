import axios from "axios";
import { appConfig } from "../config/appConfig";
import {
  mockGetUploadUrl,
  mockUploadFileToS3,
  mockAnalyzeDocument,
  mockGetHistory,
} from "./mockApi";

export async function getUploadUrl(file) {
  if (appConfig.useMocks) {
    return mockGetUploadUrl(file);
  }

  const response = await axios.post(`${appConfig.apiBaseUrl}/upload-url`, {
    fileName: file.name,
    contentType: file.type,
  });

  return response.data;
}

export async function uploadFileToS3(uploadUrl, file) {
  if (appConfig.useMocks) {
    return mockUploadFileToS3(uploadUrl, file);
  }

  await axios.put(uploadUrl, file, {
    headers: {
      "Content-Type": file.type,
    },
  });
}

export async function analyzeDocument(key, fileName) {
  if (appConfig.useMocks) {
    return mockAnalyzeDocument(key, fileName);
  }

  const response = await axios.post(`${appConfig.apiBaseUrl}/analyze`, {
    key,
    fileName,
  });

  return response.data;
}

export async function getHistory() {
  if (appConfig.useMocks) {
    return mockGetHistory();
  }

  const response = await axios.get(`${appConfig.apiBaseUrl}/history`);
  return response.data.items;
}
