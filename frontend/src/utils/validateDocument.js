export function validateDocument(file) {
  const allowedTypes = [
    "image/png",
    "image/jpeg",
    "application/pdf",
  ];

  const maxSizeInMb = 5;
  const maxSizeInBytes = maxSizeInMb * 1024 * 1024;

  if (!file) {
    return "Please select a document first.";
  }

  if (!allowedTypes.includes(file.type)) {
    return "Invalid file type. Please upload a PNG, JPG, JPEG or PDF document.";
  }

  if (file.size > maxSizeInBytes) {
    return `File is too large. Maximum allowed size is ${maxSizeInMb} MB.`;
  }

  return null;
}
