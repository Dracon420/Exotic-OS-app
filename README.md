# Exotic OS — web app

**The cloud dashboard for [Exotic OS](https://github.com/Dracon420/Exotic-OS),** a smart reptile-enclosure
monitor. Keepers sign in, see every enclosure's temperature and humidity live, get alerts, control heat and
lights, and ask an AI care advisor questions grounded in species care guides.

**Live:** https://exotic-os-app.vercel.app

---

## Features

- **Landing page** with pricing, a waitlist and sign-up.
- **Accounts:** email and password, or Google sign-in. Sessions use JWTs.
- **Enclosure dashboard:** live readings, history charts, alerts and remote control for each enclosure.
- **Sensor nodes:** each enclosure gets a token. An ESP32 node posts readings to `/api/ingest/readings` with it.
- **AI care advisor:** chat backed by Anthropic's API, using the built-in care guides for each species.
- **Payments:** Stripe checkout for the paid tiers.
- **Demo data:** a simulation loop generates readings, so the dashboard works before any hardware is
  connected.

## Tech

| Part | Stack |
|---|---|
| Frontend | React, Vite, Tailwind, shadcn/ui |
| Backend | FastAPI, MongoDB (motor), bcrypt and JWT |
| Deploy | Docker, with Railway configs for both halves |

## Run it yourself

**Backend** (`backend/`):

```bash
pip install -r requirements.txt
uvicorn server:app --reload --port 8000
```

| Variable | Required | Used for |
|---|---|---|
| `MONGO_URL`, `DB_NAME` | yes | database |
| `JWT_SECRET` | yes | signing sessions; use a long random string |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | no | creates an admin account on first start. Without them, no admin account is made |
| `ANTHROPIC_API_KEY` | no | the AI care advisor |
| `STRIPE_SECRET_KEY` | no | payments |

**Frontend** (`frontend/`):

```bash
npm install
npm start
```

Set `REACT_APP_BACKEND_URL` to the backend's address.

**Tests** (`backend/tests/`) run against a live backend. They need `REACT_APP_BACKEND_URL` and `ADMIN_PASSWORD`
set first.


---

## License

[PolyForm Noncommercial 1.0.0](LICENSE.md). You're free to use, study and change it for personal, hobby, educational and other **noncommercial** purposes. **Commercial use, including selling it or running it as a paid service, isn't allowed** without a separate licence from the author; open an issue to ask.
