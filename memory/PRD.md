# Exotic OS — Product Requirements & Build Log

## Problem Statement (original)
> Build a landing page for a product I'm designing and also an app for it. **Exotic OS powered by Albedo** — an AI-powered exotic reptile ecosystem control system.

## Source documents
- `Exotic_OS_Product_Requirements_Updated.docx` — V1/V1.5/V2+ scope
- `Exotic_OS_Project_Notes_Updated.docx` — Real enclosures, brand colors, PID details

## Architecture
- **Frontend** — React 19, Tailwind, Shadcn UI, Recharts, lucide-react, Sonner
- **Backend** — FastAPI + Motor, JWT (bcrypt), Stripe one-time, Emergent OAuth + LLM, MongoDB $text-search RAG
- **All routes prefixed `/api`**, frontend uses `REACT_APP_BACKEND_URL`

## Implemented

### Iteration 1 (May 14)
- Landing page (Hero, How It Works, Safety, Testimonials, Pricing, Waitlist, Footer)
- JWT email/password auth + admin seed
- 4 demo enclosures (Cora/Sonic/Motley/Confused Spider) with brand colors
- Dashboard + per-enclosure detail with 24h Recharts (temp/humidity/UVI tabs)
- PID setpoint controls, care log, alerts list
- AI Husbandry Advisor (Claude Sonnet 4.5)

### Iteration 2 (May 14)
- AI 1-shot retry on ChatError
- ESPHome/MQTT ingest with per-enclosure node_token + LIVE NODE/SIMULATED badge
- NodeTokenCard with copy + curl example
- Add Enclosure modal + 5 species presets + Delete cascading to sensor_readings
- In-app toast alerts on status downgrade
- Stripe one-time checkout (3 tiers) + success/cancel + graceful pending fallback
- Google OAuth (Emergent-managed) + AuthCallback

### Iteration 3 (May 14) — RAG
- **Care guides corpus** (24 vetted chunks) covering Ball Python · Crested Gecko · Corn Snake · Leopard Gecko · Bearded Dragon + cross-species (safety, vet escalation, soil rehydration)
- **MongoDB `$text` search retrieval** with species-filter + ANY-only fallback (no wrong-species leak)
- **/api/chat now returns citations + species_hint**, auto-detects species from enclosure_id or query text
- **Frontend renders `// sources` block** under each AI message with [n] index, topic, source, species tag
- **Admin endpoints** `GET /api/care-guides` (filter by species), `POST /api/care-guides` (admin-only upsert)
- Header updated: "V1.5 · Claude Sonnet 4.5 · RAG"

## Testing
- Iteration 1: 22/22 backend, 100% frontend
- Iteration 2: 22/23 + Login.jsx import + Stripe status 500 → both fixed
- Iteration 3: 16/16 backend, 100% frontend RAG flows + species-leak fix applied

## Backlog

### P1 — Near-term
- Refactor server.py (~1150 lines) → routers/{auth,enclosures,payments,chat,care_guides}.py
- External alert delivery (Resend email / Twilio SMS) — needs API keys from user
- WebSocket push for live readings (replace 12s polling)
- Persistent chat history surfacing in UI
- recharts ResponsiveContainer minHeight to silence width(-1) warning

### P2 — V1.5 alignment
- Real ESPHome firmware YAML generator (auto-fill node_token)
- Founder/admin waitlist panel with species demand heatmap
- Camera widget for Cora (go2rtc)
- Vector-embedding RAG upgrade for fuzzier semantic matches
- Care-guide editor UI (admin-only) for live corpus expansion

### P3 — V2+
- Computer-vision shed detection
- Multi-species expansion (tarantulas, leopard geckos already in corpus)
- BLE wireless sensor SKU
- Ambient-aware heat management

## Test credentials
See `/app/memory/test_credentials.md`.

## North star
"This product saved my snake's life."
