from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import math
import random
import logging
import secrets
import asyncio
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict

import bcrypt
import jwt
import httpx
from bson import ObjectId
from fastapi import FastAPI, APIRouter, Request, HTTPException, Depends
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, ConfigDict

from care_guides_seed import CARE_GUIDES_SEED

# ---------------------------------------------------------------------------
# Config
# ---------------------------------------------------------------------------
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_TTL_MIN = 60 * 24 * 7  # 7 days for simpler demo experience

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Exotic OS API")
api = APIRouter(prefix="/api")

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(message)s')
log = logging.getLogger("exotic_os")

# ---------------------------------------------------------------------------
# Seed templates: per-animal enclosure profiles based on real product notes
# ---------------------------------------------------------------------------
ENCLOSURE_SEEDS = [
    {
        "slug": "cora",
        "name": "Cora's Enclosure",
        "animal_name": "Cora",
        "species": "Ball Python",
        "enclosure_type": "40 gallon (36x18x18) glass",
        "color": "#B026FF",
        "hot_target": [88, 92],
        "cool_target": [76, 80],
        "humidity_target": [50, 60],
        "uvi_target": 1.2,
        "photoperiod_hours": 12,
        "che_wattage": 100,
        # Setpoint confirmed 90°F in HA live state (was incorrectly 32.2 on first PID cycle)
        "current_setpoint": 90,
        "has_camera": True,
        "last_fed_days_ago": 4,
        "last_shed_days_ago": 21,
        "last_soil_rehydration_hours_ago": 38,
        "ambient_baseline": 73,
        # Real hardware — V1 production stack
        "sensor_hw": "Govee BT Hygrometer",
        "relay_hw": "Tuya Smart Plug (power-loss default-on)",
        "node_hw": "Home Assistant PID (ESP32-S3 proto pending)",
        "pid_cycle_min": 5,
        "pid_kp": 2.0,
        "pid_ki": 0.1,
        "pid_kd": 1.0,
    },
    {
        "slug": "sonic",
        "name": "Sonic's Enclosure",
        "animal_name": "Sonic",
        "species": "Crested Gecko",
        "enclosure_type": "Grow tent (25.5x21.5x29.5)",
        "color": "#39FF14",
        "hot_target": [72, 78],
        "cool_target": [68, 72],
        "humidity_target": [60, 80],
        "uvi_target": 0.6,
        "photoperiod_hours": 12,
        "che_wattage": 25,
        "current_setpoint": 76,
        "has_camera": False,
        "last_fed_days_ago": 1,
        "last_shed_days_ago": 14,
        "last_soil_rehydration_hours_ago": 12,
        "ambient_baseline": 71,
        "sensor_hw": "Govee BT Hygrometer",
        "relay_hw": "Tuya Smart Plug",
        "node_hw": "Home Assistant PID",
        "pid_cycle_min": 5,
        "pid_kp": 1.5,
        "pid_ki": 0.08,
        "pid_kd": 0.8,
    },
    {
        "slug": "motley",
        "name": "Motley's Enclosure",
        "animal_name": "Motley",
        "species": "Corn Snake",
        "enclosure_type": "10-gallon (baby)",
        "color": "#FF6B00",
        "hot_target": [85, 88],
        "cool_target": [72, 78],
        "humidity_target": [40, 60],
        "uvi_target": 0.4,
        "photoperiod_hours": 12,
        "che_wattage": 50,
        "current_setpoint": 86,
        "has_camera": False,
        "last_fed_days_ago": 6,
        "last_shed_days_ago": 38,
        # 50h without rehydration: overdue per cross-species care guide (rehydrate every 24–36h)
        "last_soil_rehydration_hours_ago": 50,
        "ambient_baseline": 72,
        "sensor_hw": "Govee BT Hygrometer",
        "relay_hw": "Tuya Smart Plug",
        "node_hw": "Home Assistant PID",
        "pid_cycle_min": 5,
        "pid_kp": 2.0,
        "pid_ki": 0.1,
        "pid_kd": 1.0,
    },
    {
        "slug": "confused-spider",
        "name": "Confused Spider's Enclosure",
        "animal_name": "Confused Spider",
        "species": "Ball Python",
        # 42L tub — relay smoke test done, Tuya confirmed; Govee BT Hygrometer replacing prior sensor pre-beta
        "enclosure_type": "42L tub",
        "color": "#00BFFF",
        "hot_target": [88, 92],
        "cool_target": [76, 80],
        "humidity_target": [50, 60],
        "uvi_target": 1.0,
        "photoperiod_hours": 12,
        "che_wattage": 80,
        "current_setpoint": 89,
        "has_camera": False,
        "last_fed_days_ago": 9,
        "last_shed_days_ago": 12,
        "last_soil_rehydration_hours_ago": 22,
        "ambient_baseline": 73,
        "sensor_hw": "Govee BT Hygrometer (pending swap)",
        "relay_hw": "Tuya Smart Plug (upgrade to Kasa KP125 planned)",
        "node_hw": "Home Assistant PID",
        "pid_cycle_min": 5,
        "pid_kp": 2.0,
        "pid_ki": 0.1,
        "pid_kd": 1.0,
    },
]

# ---------------------------------------------------------------------------
# Species presets — used by the "add enclosure" wizard
# ---------------------------------------------------------------------------
SPECIES_PRESETS: List[dict] = [
    {
        "species": "Ball Python",
        "color": "#B026FF",
        "enclosure_type": "40 gallon glass",
        "hot_target": [88, 92],
        "cool_target": [76, 80],
        "humidity_target": [50, 60],
        "uvi_target": 1.2,
        "photoperiod_hours": 12,
        "che_wattage": 100,
        "current_setpoint": 88,
    },
    {
        "species": "Crested Gecko",
        "color": "#39FF14",
        "enclosure_type": "Grow tent 18x18x24",
        "hot_target": [72, 78],
        "cool_target": [68, 72],
        "humidity_target": [60, 80],
        "uvi_target": 0.6,
        "photoperiod_hours": 12,
        "che_wattage": 25,
        "current_setpoint": 75,
    },
    {
        "species": "Corn Snake",
        "color": "#FF6B00",
        "enclosure_type": "20 gallon long",
        "hot_target": [85, 88],
        "cool_target": [72, 78],
        "humidity_target": [40, 60],
        "uvi_target": 0.4,
        "photoperiod_hours": 12,
        "che_wattage": 50,
        "current_setpoint": 85,
    },
    {
        "species": "Leopard Gecko",
        "color": "#FFD400",
        "enclosure_type": "20 gallon long",
        "hot_target": [88, 92],
        "cool_target": [72, 76],
        "humidity_target": [30, 40],
        "uvi_target": 0.5,
        "photoperiod_hours": 12,
        "che_wattage": 50,
        "current_setpoint": 90,
    },
    {
        "species": "Bearded Dragon",
        "color": "#FF3366",
        "enclosure_type": "75 gallon",
        "hot_target": [95, 105],
        "cool_target": [75, 85],
        "humidity_target": [30, 40],
        "uvi_target": 4.0,
        "photoperiod_hours": 13,
        "che_wattage": 150,
        "current_setpoint": 100,
    },
]

# ---------------------------------------------------------------------------
# Stripe one-time pricing tiers (server-defined, never trust frontend amounts)
# ---------------------------------------------------------------------------
STRIPE_TIERS: Dict[str, dict] = {
    "beta": {"name": "Beta Cohort", "amount": 549.00, "currency": "usd"},
    "ball-python": {"name": "Ball Python Edition V1", "amount": 649.00, "currency": "usd"},
    "multi-species": {"name": "Multi-species + AI V1.5", "amount": 899.00, "currency": "usd"},
}

# ---------------------------------------------------------------------------
# Species keyword detection for RAG
# ---------------------------------------------------------------------------
SPECIES_KEYWORDS: Dict[str, List[str]] = {
    "Ball Python": ["ball python", "ball pythons", "regius", " bp ", "python regius"],
    "Crested Gecko": ["crested gecko", "crested geckos", "crestie", "correlophus", "rhacodactylus"],
    "Corn Snake": ["corn snake", "corn snakes", "pantherophis", "elaphe guttata"],
    "Leopard Gecko": ["leopard gecko", "leopard geckos", "leo gecko", "eublepharis"],
    "Bearded Dragon": ["bearded dragon", "bearded dragons", "beardie", "pogona", "beardy"],
}

# ---------------------------------------------------------------------------
# Pydantic models
# ---------------------------------------------------------------------------
class UserPublic(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    email: EmailStr
    name: str
    role: str = "user"
    created_at: datetime

class RegisterIn(BaseModel):
    email: EmailStr
    password: str = Field(min_length=6)
    name: str = Field(min_length=1, max_length=80)

class LoginIn(BaseModel):
    email: EmailStr
    password: str

class WaitlistIn(BaseModel):
    email: EmailStr
    name: str = Field(min_length=1, max_length=120)
    reptile_type: Optional[str] = None
    referral: Optional[str] = None

class EnclosureControlIn(BaseModel):
    setpoint: Optional[float] = None
    photoperiod_hours: Optional[int] = None

class ChatIn(BaseModel):
    message: str
    session_id: Optional[str] = None
    enclosure_id: Optional[str] = None

class EnclosureCreateIn(BaseModel):
    name: str = Field(min_length=1, max_length=80)
    animal_name: str = Field(min_length=1, max_length=80)
    species: str
    enclosure_type: str = Field(min_length=1, max_length=120)

class IngestReadingIn(BaseModel):
    node_token: str
    hot_temp: float
    cool_temp: float
    humidity: float
    uvi: float = 0.0
    duty_cycle: float = 0.0

class StripeCheckoutIn(BaseModel):
    tier_id: str
    origin_url: str

class GoogleSessionIn(BaseModel):
    session_id: str

class CareGuideIn(BaseModel):
    species: str
    topic: str = Field(min_length=1, max_length=120)
    text: str = Field(min_length=20, max_length=4000)
    source: str = Field(min_length=1, max_length=200)
    priority: int = 5

# ---------------------------------------------------------------------------
# Auth helpers
# ---------------------------------------------------------------------------
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_TTL_MIN),
        "type": "access",
    }
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    auth = request.headers.get("Authorization", "")
    token = auth.removeprefix("Bearer ").strip() if auth.startswith("Bearer ") else ""
    if not token:
        raise HTTPException(status_code=401, detail="Missing authentication token")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_admin(user: dict = Depends(get_current_user)) -> dict:
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin only")
    return user

def user_to_public(user: dict) -> dict:
    return {
        "id": str(user["_id"]),
        "email": user["email"],
        "name": user["name"],
        "role": user.get("role", "user"),
        "created_at": user["created_at"].isoformat(),
    }

# ---------------------------------------------------------------------------
# Simulation helpers
# ---------------------------------------------------------------------------
def _sim_single_step(
    hot: float, cool: float, humidity: float,
    seed: dict, sp: float
) -> tuple:
    """Advance one 5-minute simulation step. Returns (hot, cool, humidity, duty)."""
    kp = seed.get("pid_kp", 2.0)
    ambient = seed.get("ambient_baseline", 72)
    che_w = seed.get("che_wattage", 100)
    hot_target = seed.get("hot_target", [88, 92])
    cool_target = seed.get("cool_target", [76, 80])
    hum_target = seed.get("humidity_target", [50, 60])

    error = sp - hot
    duty = max(0.0, min(1.0, kp * error / 20.0))

    heating = duty * che_w * 0.008
    cooling = 0.05 * (hot - ambient)
    hot = hot + heating - cooling + random.gauss(0, 0.15)
    hot = max(float(ambient), min(float(sp) + 5.0, hot))

    cool_mid = (cool_target[0] + cool_target[1]) / 2.0
    cool = cool + 0.05 * (cool_mid - cool) + random.gauss(0, 0.3)
    cool = max(float(cool_target[0]) - 5, min(float(cool_target[1]) + 5, cool))

    hum_mid = (hum_target[0] + hum_target[1]) / 2.0
    humidity = humidity + 0.03 * (hum_mid - humidity) + random.gauss(0, 0.5)
    humidity = max(float(hum_target[0]) - 10, min(float(hum_target[1]) + 10, humidity))

    return round(hot, 1), round(cool, 1), round(humidity, 1), round(duty, 3)


def generate_history(seed: dict, hours: int = 24) -> list:
    """Generate `hours` of 5-min-interval simulated readings."""
    readings = []
    now = datetime.now(timezone.utc)
    sp = float(seed["current_setpoint"])
    hot_target = seed["hot_target"]
    cool_target = seed["cool_target"]
    hum_target = seed["humidity_target"]

    hot = (hot_target[0] + hot_target[1]) / 2.0
    cool = (cool_target[0] + cool_target[1]) / 2.0
    humidity = (hum_target[0] + hum_target[1]) / 2.0

    n = hours * 12  # 12 five-min intervals per hour
    for i in range(n):
        ts = now - timedelta(minutes=(n - i) * 5)
        hot, cool, humidity, duty = _sim_single_step(hot, cool, humidity, seed, sp)
        uvi_t = seed.get("uvi_target", 1.0)
        uvi = round(uvi_t * (0.85 + random.random() * 0.3), 2) if 6 <= ts.hour <= 18 else 0.0
        readings.append({
            "ts": ts,
            "hot_temp": hot,
            "cool_temp": cool,
            "humidity": humidity,
            "uvi": uvi,
            "duty_cycle": duty,
            "source": "simulated",
        })
    return readings


async def seed_enclosures_for_user(user_id: str) -> list:
    """Create 4 demo enclosures + 24h history for a new user."""
    enclosures = []
    _skip = {"last_fed_days_ago", "last_shed_days_ago", "last_soil_rehydration_hours_ago", "ambient_baseline"}
    for seed in ENCLOSURE_SEEDS:
        node_token = secrets.token_urlsafe(32)
        encl_doc = {
            k: v for k, v in seed.items() if k not in _skip
        }
        encl_doc.update({
            "user_id": user_id,
            "node_token": node_token,
            "is_demo": True,
            "created_at": datetime.now(timezone.utc),
        })
        result = await db.enclosures.insert_one(encl_doc)
        eid = str(result.inserted_id)

        history = generate_history(seed, hours=24)
        for r in history:
            r["enclosure_id"] = eid
        if history:
            await db.sensor_readings.insert_many(history)

        encl_doc["_id"] = result.inserted_id
        enclosures.append(encl_doc)
    return enclosures


async def _get_latest_reading(enclosure_id: str) -> Optional[dict]:
    return await db.sensor_readings.find_one(
        {"enclosure_id": enclosure_id},
        sort=[("ts", -1)]
    )


def _fmt_enclosure(encl: dict, latest: Optional[dict] = None) -> dict:
    """Serialize an enclosure document to API shape."""
    ht = encl.get("hot_target", [88, 92])
    ct = encl.get("cool_target", [76, 80])
    humt = encl.get("humidity_target", [50, 60])

    if latest:
        hot = latest.get("hot_temp", (ht[0] + ht[1]) / 2)
        cool = latest.get("cool_temp", (ct[0] + ct[1]) / 2)
        hum = latest.get("humidity", (humt[0] + humt[1]) / 2)
        uvi = latest.get("uvi", encl.get("uvi_target", 0))
        duty = latest.get("duty_cycle", 0)
        source = latest.get("source", "simulated")
    else:
        hot = (ht[0] + ht[1]) / 2
        cool = (ct[0] + ct[1]) / 2
        hum = (humt[0] + humt[1]) / 2
        uvi = encl.get("uvi_target", 0)
        duty = 0.0
        source = "simulated"

    hot_ok = ht[0] <= hot <= ht[1]
    cool_ok = ct[0] <= cool <= ct[1]
    hum_ok = humt[0] <= hum <= humt[1]
    status = "nominal" if (hot_ok and cool_ok and hum_ok) else "alert"

    return {
        "id": str(encl["_id"]),
        "slug": encl.get("slug", ""),
        "name": encl.get("name", ""),
        "animal_name": encl.get("animal_name", ""),
        "species": encl.get("species", ""),
        "enclosure_type": encl.get("enclosure_type", ""),
        "color": encl.get("color", "#00FF66"),
        "hot_target": ht,
        "cool_target": ct,
        "humidity_target": humt,
        "uvi_target": encl.get("uvi_target", 1.0),
        "photoperiod_hours": encl.get("photoperiod_hours", 12),
        "che_wattage": encl.get("che_wattage", 100),
        "current_setpoint": encl.get("current_setpoint", 88),
        "has_camera": encl.get("has_camera", False),
        "is_demo": encl.get("is_demo", True),
        "node_token": encl.get("node_token", ""),
        "sensor_hw": encl.get("sensor_hw", ""),
        "relay_hw": encl.get("relay_hw", ""),
        "node_hw": encl.get("node_hw", ""),
        "pid_kp": encl.get("pid_kp", 2.0),
        "pid_ki": encl.get("pid_ki", 0.1),
        "pid_kd": encl.get("pid_kd", 1.0),
        "pid_cycle_min": encl.get("pid_cycle_min", 5),
        "latest": {
            "hot_temp": hot,
            "cool_temp": cool,
            "humidity": hum,
            "uvi": uvi,
            "duty_cycle": duty,
            "source": source,
        },
        "status": status,
        "created_at": encl.get("created_at", datetime.now(timezone.utc)).isoformat(),
    }


# ---------------------------------------------------------------------------
# RAG helpers
# ---------------------------------------------------------------------------
def _detect_species(text: str) -> Optional[str]:
    lower = text.lower()
    for species, keywords in SPECIES_KEYWORDS.items():
        for kw in keywords:
            if kw in lower:
                return species
    return None


async def _retrieve_guides(species: Optional[str], message: str, k: int = 5) -> list:
    """Return top-k care guide chunks relevant to the message."""
    query: dict = {}
    if species:
        query["species"] = {"$in": [species, "ANY"]}

    raw = await db.care_guides.find(query).sort("priority", -1).to_list(length=50)
    if not raw:
        raw = await db.care_guides.find({}).sort("priority", -1).to_list(length=50)

    # Simple keyword scoring
    words = set(message.lower().split())
    def score(g: dict) -> int:
        text_words = set((g.get("topic", "") + " " + g.get("text", "")).lower().split())
        return len(words & text_words)

    ranked = sorted(raw, key=score, reverse=True)
    return ranked[:k]


async def _call_claude(system: str, messages: list) -> str:
    """Call Claude API via httpx. Returns assistant reply or raises."""
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        raise ValueError("ANTHROPIC_API_KEY not set")
    async with httpx.AsyncClient(timeout=90) as client_h:
        resp = await client_h.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": api_key,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json",
            },
            json={
                "model": "claude-sonnet-4-5",
                "max_tokens": 1024,
                "system": system,
                "messages": messages,
            },
        )
        resp.raise_for_status()
        return resp.json()["content"][0]["text"]


def _synthesize_reply(message: str, guides: list, enclosure_ctx: Optional[str]) -> str:
    """Fallback: synthesize a reply from care guide text without Claude."""
    parts = []
    if enclosure_ctx:
        parts.append(enclosure_ctx)
    if guides:
        parts.append("Based on the Exotic OS care guides:")
        for g in guides[:3]:
            parts.append(f"\n**{g['topic']}** — {g['text'][:300]}{'...' if len(g['text']) > 300 else ''}")
        parts.append("\n\nRefer to the sources below for full details.")
    else:
        parts.append("I couldn't find specific guidance for that question in the current care guide library. "
                     "Please consult a species-specific care guide or an ARAV-certified exotic vet.")
    return "\n".join(parts)


# ---------------------------------------------------------------------------
# Simulation background task
# ---------------------------------------------------------------------------
async def simulation_tick():
    """Continuously add new simulated readings every 5 minutes for non-node enclosures."""
    while True:
        await asyncio.sleep(300)
        try:
            async for encl in db.enclosures.find({}):
                eid = str(encl["_id"])
                cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
                node_count = await db.sensor_readings.count_documents({
                    "enclosure_id": eid,
                    "source": "node",
                    "ts": {"$gte": cutoff},
                })
                if node_count >= 6:
                    continue  # Real hardware active — skip

                last = await _get_latest_reading(eid)
                seed = next((s for s in ENCLOSURE_SEEDS if s.get("slug") == encl.get("slug")), None)
                if not seed:
                    seed = {
                        "hot_target": encl.get("hot_target", [88, 92]),
                        "cool_target": encl.get("cool_target", [76, 80]),
                        "humidity_target": encl.get("humidity_target", [50, 60]),
                        "ambient_baseline": 72,
                        "uvi_target": encl.get("uvi_target", 1.0),
                        "che_wattage": encl.get("che_wattage", 100),
                        "pid_kp": encl.get("pid_kp", 2.0),
                        "pid_ki": encl.get("pid_ki", 0.1),
                        "pid_kd": encl.get("pid_kd", 1.0),
                    }

                sp = float(encl.get("current_setpoint", seed.get("hot_target", [88, 92])[0]))
                ht = seed.get("hot_target", [88, 92])
                ct = seed.get("cool_target", [76, 80])
                humt = seed.get("humidity_target", [50, 60])

                hot = last["hot_temp"] if last else (ht[0] + ht[1]) / 2.0
                cool = last["cool_temp"] if last else (ct[0] + ct[1]) / 2.0
                humidity = last["humidity"] if last else (humt[0] + humt[1]) / 2.0

                hot, cool, humidity, duty = _sim_single_step(hot, cool, humidity, seed, sp)
                now = datetime.now(timezone.utc)
                uvi_t = seed.get("uvi_target", 1.0)
                uvi = round(uvi_t * (0.85 + random.random() * 0.3), 2) if 6 <= now.hour <= 18 else 0.0

                await db.sensor_readings.insert_one({
                    "enclosure_id": eid,
                    "ts": now,
                    "hot_temp": hot,
                    "cool_temp": cool,
                    "humidity": humidity,
                    "uvi": uvi,
                    "duty_cycle": duty,
                    "source": "simulated",
                })
        except Exception as exc:
            log.error(f"simulation_tick error: {exc}")


# ---------------------------------------------------------------------------
# Startup / shutdown
# ---------------------------------------------------------------------------
@app.on_event("startup")
async def startup():
    # Indexes
    await db.users.create_index("email", unique=True)
    await db.enclosures.create_index([("user_id", 1)])
    await db.sensor_readings.create_index([("enclosure_id", 1), ("ts", -1)])
    await db.care_guides.create_index([("species", 1), ("topic", 1)], unique=True)
    await db.waitlist.create_index("email", unique=True)

    # Seed care guides (upsert — idempotent)
    for guide in CARE_GUIDES_SEED:
        await db.care_guides.update_one(
            {"species": guide["species"], "topic": guide["topic"]},
            {"$set": guide},
            upsert=True,
        )
    log.info(f"Care guides seeded: {len(CARE_GUIDES_SEED)} chunks")

    # Admin account: only created when ADMIN_EMAIL and ADMIN_PASSWORD are set in the
    # environment. Never hard-code credentials here; this repository is public.
    admin_email = os.environ.get("ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("ADMIN_PASSWORD", "")
    if admin_email and admin_password:
        admin = await db.users.find_one({"email": admin_email})
        if not admin:
            await db.users.insert_one({
                "email": admin_email,
                "name": os.environ.get("ADMIN_NAME", "Admin"),
                "password_hash": hash_password(admin_password),
                "role": "admin",
                "created_at": datetime.now(timezone.utc),
            })
            admin = await db.users.find_one({"email": admin_email})
            await seed_enclosures_for_user(str(admin["_id"]))
            log.info("Admin account created and seeded")
        else:
            log.info("Admin account already exists")
    else:
        log.info("ADMIN_EMAIL / ADMIN_PASSWORD not set - no admin account created")

    # Start simulation loop
    asyncio.create_task(simulation_tick())
    log.info("Exotic OS API started")


# ---------------------------------------------------------------------------
# CORS
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes — health & stats
# ---------------------------------------------------------------------------
@api.get("/")
async def health():
    return {"ok": True, "version": "V1.5"}


@api.get("/stats")
async def stats():
    waitlist_count = await db.waitlist.count_documents({})
    enclosure_count = await db.enclosures.count_documents({})
    return {
        "waitlist": waitlist_count,
        "active_kits": 0,
        "uptime_hours": 0,
        "alerts_handled": 0,
    }


# ---------------------------------------------------------------------------
# Waitlist
# ---------------------------------------------------------------------------
@api.post("/waitlist")
async def join_waitlist(body: WaitlistIn):
    existing = await db.waitlist.find_one({"email": body.email})
    if existing:
        position = await db.waitlist.count_documents(
            {"created_at": {"$lte": existing["created_at"]}}
        )
        return {"ok": True, "position": position}
    doc = {
        "email": body.email,
        "name": body.name,
        "reptile_type": body.reptile_type,
        "referral": body.referral,
        "created_at": datetime.now(timezone.utc),
    }
    await db.waitlist.insert_one(doc)
    position = await db.waitlist.count_documents({})
    return {"ok": True, "position": position}


# ---------------------------------------------------------------------------
# Auth
# ---------------------------------------------------------------------------
@api.post("/auth/register")
async def register(body: RegisterIn):
    existing = await db.users.find_one({"email": body.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user_doc = {
        "email": body.email,
        "name": body.name,
        "password_hash": hash_password(body.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)
    await seed_enclosures_for_user(user_id)
    token = create_access_token(user_id, body.email)
    user_doc["_id"] = result.inserted_id
    return {"token": token, "user": user_to_public(user_doc)}


@api.post("/auth/login")
async def login(body: LoginIn):
    user = await db.users.find_one({"email": body.email})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    token = create_access_token(str(user["_id"]), user["email"])
    return {"token": token, "user": user_to_public(user)}


@api.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user_to_public(user)


@api.post("/auth/google/session")
async def google_session(body: GoogleSessionIn):
    """Exchange a Emergent/Google session_id for a JWT. 401 if not valid."""
    doc = await db.google_sessions.find_one({"session_id": body.session_id})
    if not doc:
        raise HTTPException(status_code=401, detail="Invalid or expired Google session")
    user = await db.users.find_one({"_id": doc["user_id"]})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    token = create_access_token(str(user["_id"]), user["email"])
    return {"token": token, "user": user_to_public(user)}


# ---------------------------------------------------------------------------
# Enclosures
# ---------------------------------------------------------------------------
@api.get("/enclosures")
async def list_enclosures(user: dict = Depends(get_current_user)):
    uid = str(user["_id"])
    cursor = db.enclosures.find({"user_id": uid})
    enclosures = await cursor.to_list(length=100)
    result = []
    for encl in enclosures:
        latest = await _get_latest_reading(str(encl["_id"]))
        result.append(_fmt_enclosure(encl, latest))
    return result


@api.get("/enclosures/{enclosure_id}")
async def get_enclosure(enclosure_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(enclosure_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    encl = await db.enclosures.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not encl:
        raise HTTPException(status_code=404, detail="Enclosure not found")
    latest = await _get_latest_reading(enclosure_id)
    return _fmt_enclosure(encl, latest)


@api.get("/enclosures/{enclosure_id}/readings")
async def get_readings(
    enclosure_id: str,
    hours: int = 24,
    user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(enclosure_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    encl = await db.enclosures.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not encl:
        raise HTTPException(status_code=404, detail="Enclosure not found")

    cutoff = datetime.now(timezone.utc) - timedelta(hours=hours)
    cursor = db.sensor_readings.find(
        {"enclosure_id": enclosure_id, "ts": {"$gte": cutoff}},
        sort=[("ts", 1)],
    )
    docs = await cursor.to_list(length=10000)

    # Determine source: if >=6 node readings in last 10 min, source=node
    node_cutoff = datetime.now(timezone.utc) - timedelta(minutes=10)
    node_count = sum(1 for d in docs if d.get("source") == "node" and d["ts"] >= node_cutoff)
    source = "node" if node_count >= 6 else "simulated"

    points = [
        {
            "ts": d["ts"].isoformat(),
            "hot_temp": d.get("hot_temp", 0),
            "cool_temp": d.get("cool_temp", 0),
            "humidity": d.get("humidity", 0),
            "uvi": d.get("uvi", 0),
            "duty_cycle": d.get("duty_cycle", 0),
            "source": d.get("source", "simulated"),
        }
        for d in docs
    ]
    return {"enclosure_id": enclosure_id, "points": points, "source": source}


@api.get("/enclosures/{enclosure_id}/alerts")
async def get_alerts(enclosure_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(enclosure_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    encl = await db.enclosures.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not encl:
        raise HTTPException(status_code=404, detail="Enclosure not found")

    alerts = []
    latest = await _get_latest_reading(enclosure_id)
    if latest:
        hot = latest.get("hot_temp", 0)
        cool = latest.get("cool_temp", 0)
        hum = latest.get("humidity", 0)
        ht = encl.get("hot_target", [88, 92])
        ct = encl.get("cool_target", [76, 80])
        humt = encl.get("humidity_target", [50, 60])
        if not (ht[0] <= hot <= ht[1]):
            alerts.append({"type": "hot_temp_out_of_range", "value": hot, "target": ht})
        if not (ct[0] <= cool <= ct[1]):
            alerts.append({"type": "cool_temp_out_of_range", "value": cool, "target": ct})
        if not (humt[0] <= hum <= humt[1]):
            alerts.append({"type": "humidity_out_of_range", "value": hum, "target": humt})
    return alerts


@api.post("/enclosures/{enclosure_id}/control")
async def control_enclosure(
    enclosure_id: str,
    body: EnclosureControlIn,
    user: dict = Depends(get_current_user),
):
    try:
        oid = ObjectId(enclosure_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    encl = await db.enclosures.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not encl:
        raise HTTPException(status_code=404, detail="Enclosure not found")

    update: dict = {}
    if body.setpoint is not None:
        clamped = max(60.0, min(100.0, body.setpoint))
        update["current_setpoint"] = clamped
    if body.photoperiod_hours is not None:
        update["photoperiod_hours"] = max(0, min(24, body.photoperiod_hours))

    if update:
        await db.enclosures.update_one({"_id": oid}, {"$set": update})
        encl.update(update)

    latest = await _get_latest_reading(enclosure_id)
    return _fmt_enclosure(encl, latest)


@api.post("/enclosures")
async def create_enclosure(body: EnclosureCreateIn, user: dict = Depends(get_current_user)):
    preset = next((p for p in SPECIES_PRESETS if p["species"] == body.species), None)
    if not preset:
        raise HTTPException(status_code=400, detail=f"Unknown species: {body.species}. Use GET /api/presets/species for valid options.")

    node_token = secrets.token_urlsafe(32)
    encl_doc = {
        **preset,
        "name": body.name,
        "animal_name": body.animal_name,
        "enclosure_type": body.enclosure_type,
        "slug": body.animal_name.lower().replace(" ", "-"),
        "has_camera": False,
        "user_id": str(user["_id"]),
        "node_token": node_token,
        "is_demo": False,
        "sensor_hw": "",
        "relay_hw": "",
        "node_hw": "",
        "pid_kp": 2.0,
        "pid_ki": 0.1,
        "pid_kd": 1.0,
        "pid_cycle_min": 5,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.enclosures.insert_one(encl_doc)
    eid = str(result.inserted_id)

    # Generate 6h of initial history
    history = generate_history(preset, hours=6)
    for r in history:
        r["enclosure_id"] = eid
    if history:
        await db.sensor_readings.insert_many(history)

    encl_doc["_id"] = result.inserted_id
    latest = await _get_latest_reading(eid)
    return _fmt_enclosure(encl_doc, latest)


@api.delete("/enclosures/{enclosure_id}")
async def delete_enclosure(enclosure_id: str, user: dict = Depends(get_current_user)):
    try:
        oid = ObjectId(enclosure_id)
    except Exception:
        raise HTTPException(status_code=404, detail="Not found")
    encl = await db.enclosures.find_one({"_id": oid, "user_id": str(user["_id"])})
    if not encl:
        raise HTTPException(status_code=404, detail="Enclosure not found")
    await db.enclosures.delete_one({"_id": oid})
    await db.sensor_readings.delete_many({"enclosure_id": enclosure_id})
    return {"ok": True, "deleted": enclosure_id}


# ---------------------------------------------------------------------------
# Sensor ingest (node auth, no user JWT)
# ---------------------------------------------------------------------------
@api.post("/ingest/readings")
async def ingest_readings(body: IngestReadingIn):
    encl = await db.enclosures.find_one({"node_token": body.node_token})
    if not encl:
        raise HTTPException(status_code=401, detail="Invalid node token")

    eid = str(encl["_id"])
    doc = {
        "enclosure_id": eid,
        "ts": datetime.now(timezone.utc),
        "hot_temp": body.hot_temp,
        "cool_temp": body.cool_temp,
        "humidity": body.humidity,
        "uvi": body.uvi,
        "duty_cycle": body.duty_cycle,
        "source": "node",
    }
    await db.sensor_readings.insert_one(doc)
    return {"ok": True, "enclosure": encl.get("animal_name", eid)}


# ---------------------------------------------------------------------------
# Species presets
# ---------------------------------------------------------------------------
@api.get("/presets/species")
async def species_presets():
    return SPECIES_PRESETS


# ---------------------------------------------------------------------------
# Payments (Stripe optional — graceful fallback)
# ---------------------------------------------------------------------------
@api.get("/payments/tiers")
async def payment_tiers():
    return [
        {"id": tier_id, **tier_data}
        for tier_id, tier_data in STRIPE_TIERS.items()
    ]


@api.post("/payments/checkout")
async def create_checkout(body: StripeCheckoutIn, user: dict = Depends(get_current_user)):
    tier = STRIPE_TIERS.get(body.tier_id)
    if not tier:
        raise HTTPException(status_code=400, detail=f"Unknown tier: {body.tier_id}")

    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    session_id = f"cs_sim_{secrets.token_urlsafe(16)}"
    checkout_url = f"{body.origin_url.rstrip('/')}/payment?session_id={session_id}"

    if stripe_key:
        try:
            async with httpx.AsyncClient(timeout=30) as client_h:
                resp = await client_h.post(
                    "https://api.stripe.com/v1/checkout/sessions",
                    auth=(stripe_key, ""),
                    data={
                        "payment_method_types[]": "card",
                        "line_items[0][price_data][currency]": tier["currency"],
                        "line_items[0][price_data][product_data][name]": tier["name"],
                        "line_items[0][price_data][unit_amount]": int(tier["amount"] * 100),
                        "line_items[0][quantity]": "1",
                        "mode": "payment",
                        "success_url": f"{body.origin_url}/payment-success?session_id={{CHECKOUT_SESSION_ID}}",
                        "cancel_url": f"{body.origin_url}/#pricing",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    session_id = data["id"]
                    checkout_url = data["url"]
        except Exception as exc:
            log.warning(f"Stripe checkout failed, using simulated: {exc}")

    # Persist session for status lookup
    await db.payment_sessions.update_one(
        {"session_id": session_id},
        {"$set": {
            "session_id": session_id,
            "user_id": str(user["_id"]),
            "tier_id": body.tier_id,
            "amount": tier["amount"],
            "currency": tier["currency"],
            "payment_status": "pending",
            "created_at": datetime.now(timezone.utc),
        }},
        upsert=True,
    )
    return {"url": checkout_url, "session_id": session_id}


@api.get("/payments/status/{session_id}")
async def payment_status(session_id: str, user: dict = Depends(get_current_user)):
    doc = await db.payment_sessions.find_one({"session_id": session_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Payment session not found")

    stripe_key = os.environ.get("STRIPE_SECRET_KEY", "")
    payment_status_val = doc.get("payment_status", "pending")

    if stripe_key and session_id.startswith("cs_"):
        try:
            async with httpx.AsyncClient(timeout=20) as client_h:
                resp = await client_h.get(
                    f"https://api.stripe.com/v1/checkout/sessions/{session_id}",
                    auth=(stripe_key, ""),
                )
                if resp.status_code == 200:
                    payment_status_val = resp.json().get("payment_status", payment_status_val)
                    await db.payment_sessions.update_one(
                        {"session_id": session_id},
                        {"$set": {"payment_status": payment_status_val}},
                    )
        except Exception as exc:
            log.warning(f"Stripe status lookup failed: {exc}")

    return {
        "session_id": session_id,
        "tier_id": doc.get("tier_id"),
        "amount": doc.get("amount"),
        "currency": doc.get("currency"),
        "payment_status": payment_status_val,
    }


# ---------------------------------------------------------------------------
# AI Chat with RAG
# ---------------------------------------------------------------------------
@api.post("/chat")
async def chat(body: ChatIn, user: dict = Depends(get_current_user)):
    session_id = body.session_id or secrets.token_urlsafe(12)
    user_id = str(user["_id"])

    # Detect species from message text
    species_hint = _detect_species(body.message)

    # If enclosure_id provided, override species from that enclosure
    enclosure_ctx = None
    if body.enclosure_id:
        try:
            encl = await db.enclosures.find_one({
                "_id": ObjectId(body.enclosure_id),
                "user_id": user_id,
            })
            if encl:
                species_hint = encl.get("species") or species_hint
                latest = await _get_latest_reading(body.enclosure_id)
                if latest:
                    enclosure_ctx = (
                        f"Current readings for {encl.get('animal_name', 'this enclosure')} "
                        f"({encl.get('species', 'unknown species')}, {encl.get('enclosure_type', '')}):\n"
                        f"  Hot side: {latest.get('hot_temp')}°F (target {encl.get('hot_target')})\n"
                        f"  Cool side: {latest.get('cool_temp')}°F (target {encl.get('cool_target')})\n"
                        f"  Humidity: {latest.get('humidity')}% (target {encl.get('humidity_target')})\n"
                        f"  UVI: {latest.get('uvi')}\n"
                        f"  Duty cycle: {round(latest.get('duty_cycle', 0) * 100)}%\n"
                        f"  Setpoint: {encl.get('current_setpoint')}°F\n"
                    )
        except Exception:
            pass

    # Retrieve relevant care guides
    guides = await _retrieve_guides(species_hint, body.message, k=5)
    citations = [
        {
            "species": g.get("species", "ANY"),
            "topic": g.get("topic", ""),
            "source": g.get("source", ""),
            "priority": g.get("priority", 5),
        }
        for g in guides
    ]

    # Build reply
    try:
        guide_context = "\n\n".join(
            f"[{g['topic']} · {g['species']}]\n{g['text']}\nSource: {g['source']}"
            for g in guides
        )
        system_prompt = (
            "You are Albedo, the AI husbandry advisor for Exotic OS — an automated reptile enclosure "
            "management system. You give concise, practical, evidence-based reptile care advice. "
            "You NEVER diagnose medical conditions. You always cite your sources. "
            "Keep answers under 300 words.\n\n"
            "Relevant care guide excerpts:\n"
            + guide_context
        )
        if enclosure_ctx:
            system_prompt += f"\n\nLive enclosure context:\n{enclosure_ctx}"

        # Load chat history for this session (last 10 messages)
        history_docs = await db.chat_sessions.find(
            {"session_id": session_id, "user_id": user_id},
            sort=[("created_at", -1)],
        ).to_list(length=10)
        history_docs = list(reversed(history_docs))
        messages = [{"role": d["role"], "content": d["content"]} for d in history_docs]
        messages.append({"role": "user", "content": body.message})

        reply = await _call_claude(system_prompt, messages)
    except Exception as exc:
        log.warning(f"Claude unavailable: {exc} — using synthesized reply")
        reply = _synthesize_reply(body.message, guides, enclosure_ctx)

    # Persist user message
    await db.chat_sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "role": "user",
        "content": body.message,
        "created_at": datetime.now(timezone.utc),
    })
    # Persist assistant message with metadata
    await db.chat_sessions.insert_one({
        "session_id": session_id,
        "user_id": user_id,
        "role": "assistant",
        "content": reply,
        "citations": citations,
        "species_hint": species_hint,
        "created_at": datetime.now(timezone.utc),
    })

    return {
        "reply": reply,
        "session_id": session_id,
        "citations": citations,
        "species_hint": species_hint,
    }


@api.get("/chat/history")
async def chat_history(session_id: str, user: dict = Depends(get_current_user)):
    docs = await db.chat_sessions.find(
        {"session_id": session_id, "user_id": str(user["_id"])},
        sort=[("created_at", 1)],
    ).to_list(length=200)
    return [
        {
            "role": d["role"],
            "content": d["content"],
            "citations": d.get("citations", []),
            "species_hint": d.get("species_hint"),
            "created_at": d["created_at"].isoformat(),
        }
        for d in docs
    ]


# ---------------------------------------------------------------------------
# Care guides (RAG corpus management)
# ---------------------------------------------------------------------------
@api.get("/care-guides")
async def list_care_guides(
    species: Optional[str] = None,
    user: dict = Depends(get_current_user),
):
    query: dict = {}
    if species:
        query["species"] = {"$in": [species, "ANY"]}

    docs = await db.care_guides.find(query).sort("priority", -1).to_list(length=500)
    return [
        {
            "species": d["species"],
            "topic": d["topic"],
            "text": d["text"],
            "source": d["source"],
            "priority": d.get("priority", 5),
        }
        for d in docs
    ]


@api.post("/care-guides")
async def upsert_care_guide(body: CareGuideIn, admin: dict = Depends(require_admin)):
    doc = {
        "species": body.species,
        "topic": body.topic,
        "text": body.text,
        "source": body.source,
        "priority": body.priority,
    }
    await db.care_guides.update_one(
        {"species": body.species, "topic": body.topic},
        {"$set": doc},
        upsert=True,
    )
    return {"ok": True}


# ---------------------------------------------------------------------------
# Register router & run
# ---------------------------------------------------------------------------
app.include_router(api)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
