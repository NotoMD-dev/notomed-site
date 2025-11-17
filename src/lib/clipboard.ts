export async function copyToClipboard(payload: string): Promise<void> {
  if (typeof payload !== "string" || payload.length === 0) {
    return;
  }

  const hasNavigator =
    typeof navigator !== "undefined" &&
    typeof navigator.clipboard?.writeText === "function";
  const isSecureContext =
    typeof window !== "undefined" &&
    (window.isSecureContext || window.location.hostname === "localhost");

  if (hasNavigator && isSecureContext) {
    await navigator.clipboard.writeText(payload);
    return;
  }

  if (typeof document === "undefined") {
    throw new Error("Clipboard is not available in this environment");
  }

  const textarea = document.createElement("textarea");
  textarea.value = payload;
  textarea.setAttribute("readonly", "");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    document.execCommand("copy");
  } finally {
    document.body.removeChild(textarea);
  }
}
