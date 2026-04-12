const DEFAULT_API_PATH = "/api/chat";

function getApiEndpoint() {
  const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

  if (!configuredBaseUrl) {
    return DEFAULT_API_PATH;
  }

  return `${configuredBaseUrl.replace(/\/+$/, "")}${DEFAULT_API_PATH}`;
}

function extractAssistantReply(data) {
  return (
    data?.answer ||
    data?.response ||
    data?.message ||
    data?.reply ||
    data?.output ||
    "Es wurde keine verwertbare Antwort vom Backend zurückgegeben."
  );
}

export async function requestAssistantReply({ message, history, sessionId }) {
  let response;

  try {
    response = await fetch(getApiEndpoint(), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message,
        history,
        session_id: sessionId,
      }),
    });
  } catch {
    throw new Error(
      "Das Backend ist nicht erreichbar. Starte zuerst main.py auf http://127.0.0.1:8000 und prüfe danach den Chat erneut.",
    );
  }

  const rawBody = await response.text();
  let data = null;

  try {
    data = rawBody ? JSON.parse(rawBody) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const detail =
      data?.detail ||
      data?.error ||
      data?.message ||
      rawBody.trim();

    const suffix = detail ? ` ${String(detail).trim()}` : "";
    throw new Error(`Das Backend konnte gerade keine Antwort liefern.${suffix}`);
  }

  return extractAssistantReply(data);
}
