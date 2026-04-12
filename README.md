# HaqqAI Frontend

Die Chat-Views senden an `POST /api/chat`. Im Dev-Modus leitet Vite `/api/*` standardmäßig an `http://127.0.0.1:8000` weiter.

## Backend-Vertrag

Request:

```json
{
  "message": "Salam",
  "history": [
    { "role": "user", "content": "Salam" }
  ],
  "session_id": "abc-123"
}
```

Response:

```json
{
  "answer": "Wa alaikum salam"
}
```

Zusätzlich akzeptiert das Frontend auch `response`, `message`, `reply` oder `output` als Antwortfeld.

## Starten

1. Backend starten, zum Beispiel `python main.py`.
2. Optional `.env` aus `.env.example` anlegen.
3. Frontend mit `npm run dev` starten.

## Umgebungsvariablen

```env
VITE_BACKEND_URL=http://127.0.0.1:8000
VITE_API_BASE_URL=
```

`VITE_BACKEND_URL` steuert den Vite-Proxy im Dev-Modus.

`VITE_API_BASE_URL` ist für Deployments ohne Proxy gedacht, wenn das Frontend direkt gegen eine externe API sprechen soll.
