"""
Seed content for the Albedo AI Husbandry Advisor's RAG layer.

Each entry is a short, self-contained chunk that can stand alone as retrieval
context. Sources are cited so the advisor can show them to the keeper.

Content has been written to align with the species profiles already declared
in server.py (hot/cool gradients, humidity bands, photoperiod, UVI targets) and
referenced reptile-keeping resources. This is the V1.5 starting corpus —
admins can expand it via POST /api/care-guides.
"""

CARE_GUIDES_SEED = [
    # ------------------------------------------------------------------ Ball Python
    {
        "species": "Ball Python",
        "topic": "Temperature gradient",
        "text": (
            "A ball python needs a true thermal gradient. Hot side (basking surface) should sit "
            "between 88 and 92F. Cool side should range 76 to 80F. Ambient room temp affects how "
            "easily a CHE can hold the hot side; if you cannot reach the upper end of the band, "
            "raising your CHE wattage helps but mounting height matters more (inverse-square law). "
            "Use two probes, one each end. Never rely on a single ambient reading."
        ),
        "source": "ReptiFiles · Ball Python Care Guide",
        "priority": 9,
    },
    {
        "species": "Ball Python",
        "topic": "Humidity & shedding",
        "text": (
            "Normal ball python humidity sits at 50-60%. During the shed cycle — visible as cloudy "
            "'blue' eyes followed by a dull skin pre-shed — boost humidity to 70-80% for 5 to 10 "
            "days. Methods: pour 250-500ml of dechlorinated water into substrate, add a damp "
            "sphagnum moss hide, partially cover mesh top. Persistently low humidity causes stuck "
            "shed (dysecdysis), especially around the eye caps and tail tip."
        ),
        "source": "World of Ball Pythons · Shed Cycle",
        "priority": 10,
    },
    {
        "species": "Ball Python",
        "topic": "Feeding schedule",
        "text": (
            "Ball pythons are ambush feeders that eat infrequently. Hatchlings: small mouse every "
            "5-7 days. Juveniles (200-800g): one appropriately sized rat every 7-10 days. Adults "
            "(>800g): one rat every 10-14 days. Refuse feeds are common, particularly during "
            "breeding season or pre-shed — a healthy adult can safely skip 1-2 months. Always feed "
            "thawed frozen rodents; live prey carries injury risk."
        ),
        "source": "Reptiles Magazine · Ball Python Feeding",
        "priority": 8,
    },
    {
        "species": "Ball Python",
        "topic": "UVB & lighting",
        "text": (
            "Ball pythons are crepuscular and historically kept without UVB. Modern research (Baines "
            "et al.) supports a low UVI (~1.0-1.5) for vitamin D3 synthesis and circadian rhythm. "
            "Use a low-output linear UVB (5%/T5HO) on a 12 hours on / 12 hours off photoperiod. "
            "Replace UVB bulbs quarterly even if they still emit visible light — UVB output drops "
            "long before the bulb stops working."
        ),
        "source": "Reptile Lighting · Frances Baines",
        "priority": 7,
    },
    {
        "species": "Ball Python",
        "topic": "Hot day & overheating",
        "text": (
            "On hot ambient days the enclosure can exceed safe thresholds. A safety thermostat (e.g. "
            "Inkbird ITC-2CH) set 1-2F above the basking target is the last-line cutoff. If the "
            "Inkbird trips, ALL controlled relays go offline — Exotic OS detects this and alerts. "
            "Immediate actions: cool the room (AC, fan), provide a deep water bowl for the snake to "
            "soak, do not re-enable heating until ambient drops below the cutoff threshold."
        ),
        "source": "Exotic OS PRD · Sonic's Hot Day Origin Story",
        "priority": 10,
    },

    # ------------------------------------------------------------------ Crested Gecko
    {
        "species": "Crested Gecko",
        "topic": "Temperature requirements",
        "text": (
            "Crested geckos are sub-tropical and prefer cooler temps than most lizards. Daytime "
            "ambient 72-78F is ideal; cool side around 68-72F is fine. Anything sustained above "
            "85F causes heat stress — do not use overhead basking bulbs. In most households a CHE "
            "is only needed in cold rooms; a 25W bulb on a thermostat is enough."
        ),
        "source": "Pangea Reptile · Crested Gecko Husbandry",
        "priority": 9,
    },
    {
        "species": "Crested Gecko",
        "topic": "Humidity & misting",
        "text": (
            "Crested geckos need 60-80% humidity, with a dry-down phase between mistings. Mist "
            "heavily 1-2 hours after lights-off to mimic dew. Substrate should hold moisture (bio-"
            "active or coco fiber). Persistent saturation above 90% causes respiratory infection "
            "and skin issues; persistent dryness below 50% causes stuck shed."
        ),
        "source": "Pangea Reptile · Husbandry Guide",
        "priority": 9,
    },
    {
        "species": "Crested Gecko",
        "topic": "Diet & calcium",
        "text": (
            "A complete diet for adult crested geckos is a commercial gecko diet (CGD): Pangea, "
            "Repashy, Black Panther Zoological. Mix to ketchup consistency, offer 2-3 times per "
            "week, replace within 24-36 hours. Hatchlings benefit from gut-loaded insects "
            "(crickets, dubia) dusted with calcium + D3 once weekly. Adults: optional insect "
            "feeding every 1-2 weeks for enrichment."
        ),
        "source": "Repashy · Crested Gecko Diet",
        "priority": 8,
    },
    {
        "species": "Crested Gecko",
        "topic": "UVB exposure",
        "text": (
            "Crested geckos are nocturnal but emerging evidence supports a low UVI (0.5-1.0) for "
            "calcium metabolism. Use a 5% T5 UVB at the top of the enclosure, with thick foliage "
            "providing shade so the gecko self-regulates. Replace bulb every 12 months."
        ),
        "source": "Reptile Lighting · Crested Gecko UV Index",
        "priority": 6,
    },

    # ------------------------------------------------------------------ Corn Snake
    {
        "species": "Corn Snake",
        "topic": "Small enclosure caveat",
        "text": (
            "Hatchling and juvenile corn snakes are commonly housed in 10-gallon enclosures, but "
            "maintaining a proper thermal gradient is physically difficult — both probes will read "
            "similar temps because they cannot be far enough apart. Exotic OS reports this honestly "
            "rather than pretending automation can solve a physical constraint. Plan to upgrade to "
            "a 20L (long) or 40 breeder once the snake exceeds ~150g."
        ),
        "source": "Exotic OS PRD · Baby Corn Snake in 10-Gallon",
        "priority": 10,
    },
    {
        "species": "Corn Snake",
        "topic": "Temperature gradient",
        "text": (
            "Hot side basking: 85-88F. Cool side: 72-78F. Night drop into the low 70s is healthy. "
            "Belly heat (under-tank heat mat) on a thermostat works well, or a low-watt CHE if your "
            "room runs cold. Avoid colored heat bulbs — they disrupt circadian rhythm."
        ),
        "source": "ReptiFiles · Corn Snake Care",
        "priority": 9,
    },
    {
        "species": "Corn Snake",
        "topic": "Humidity",
        "text": (
            "Corn snakes do well at 40-60% ambient humidity. Provide a humid hide (damp sphagnum) "
            "during shed. Excess humidity (sustained >70%) causes scale rot. A water bowl large "
            "enough for the snake to fully submerge handles routine moisture needs."
        ),
        "source": "ReptiFiles · Corn Snake Care",
        "priority": 8,
    },
    {
        "species": "Corn Snake",
        "topic": "Feeding & growth",
        "text": (
            "Hatchlings: pinky mouse every 5-7 days. Juveniles: fuzzy/hopper every 7 days. Sub-"
            "adults: adult mouse every 7-10 days. Adults: large adult mouse every 10-14 days. Prey "
            "diameter should be ~1.5x the widest part of the snake. Always thawed frozen."
        ),
        "source": "Munson Plan · Corn Snake Feeding",
        "priority": 7,
    },

    # ------------------------------------------------------------------ Leopard Gecko
    {
        "species": "Leopard Gecko",
        "topic": "Temperature & basking",
        "text": (
            "Leopard geckos need belly heat at a basking surface temp of 88-92F. Air temperature is "
            "secondary — they absorb heat through ventral scales. Cool side: 72-76F. Night drop to "
            "low 70s is fine. Use a heat mat regulated by a proportional thermostat. Avoid hot rocks."
        ),
        "source": "ReptileGuide · Leopard Gecko Husbandry",
        "priority": 9,
    },
    {
        "species": "Leopard Gecko",
        "topic": "Humidity & humid hide",
        "text": (
            "Ambient humidity 30-40% works for healthy leopard geckos. Provide a humid hide (damp "
            "sphagnum moss in a small container) for shedding. Stuck shed on toes is a common issue "
            "from insufficient humid-hide use — soak the gecko in lukewarm water for 10 minutes if "
            "you notice retained shed."
        ),
        "source": "ReptileGuide · Leopard Gecko Shedding",
        "priority": 8,
    },
    {
        "species": "Leopard Gecko",
        "topic": "Diet & calcium supplementation",
        "text": (
            "Insectivorous: gut-loaded crickets, dubia roaches, mealworms, occasional waxworms (high "
            "fat — treat only). Dust insects with plain calcium 2-3 feedings per week. Calcium with "
            "D3 once weekly. Reptile multivitamin once every 2 weeks. Pinhead crickets for hatchlings, "
            "scaling up to medium crickets for adults."
        ),
        "source": "Reptiles Magazine · Leopard Gecko Diet",
        "priority": 8,
    },
    {
        "species": "Leopard Gecko",
        "topic": "UVB exposure",
        "text": (
            "Once considered unnecessary, low-level UVB (UVI 0.5) is now recommended for D3 "
            "synthesis. Use a 5% T5 UVB on a 12-hour photoperiod with shaded areas. Improves bone "
            "density and reduces dependence on D3 powder."
        ),
        "source": "Frances Baines · UV Tool",
        "priority": 6,
    },

    # ------------------------------------------------------------------ Bearded Dragon
    {
        "species": "Bearded Dragon",
        "topic": "UVB requirements",
        "text": (
            "Bearded dragons are diurnal heliotherms and REQUIRE high-output UVB. Use a 10-12% T5 HO "
            "linear UVB across 2/3 of the enclosure length, with the basking spot 10-12 inches "
            "below the bulb. Target UVI 4-6 at the basking surface. Replace UVB bulbs every 12 "
            "months. Insufficient UVB causes metabolic bone disease — a leading killer of pet beardies."
        ),
        "source": "Arizona-Sonora Desert Museum · Beardie Husbandry",
        "priority": 10,
    },
    {
        "species": "Bearded Dragon",
        "topic": "Basking & gradient",
        "text": (
            "Adult bearded dragons need a basking surface temp of 95-105F (juveniles slightly hotter, "
            "100-110F). Cool side: 75-85F. Use a halogen flood bulb, not a coiled compact — "
            "halogens produce a wider, more natural infrared spread. Night drop to 65-75F is healthy."
        ),
        "source": "ASDM · Beardie Husbandry",
        "priority": 9,
    },
    {
        "species": "Bearded Dragon",
        "topic": "Diet ratios",
        "text": (
            "Hatchlings/juveniles: 80% insects, 20% plant matter. Adults: 20% insects, 80% plant "
            "matter (collard greens, mustard greens, butternut squash, dandelion, cactus pad). "
            "Insects: dubia roaches, BSF larvae, crickets, hornworms. Avoid feeder insects larger "
            "than the space between the dragon's eyes — impaction risk."
        ),
        "source": "Beautiful Dragons · Diet Sheet",
        "priority": 8,
    },
    {
        "species": "Bearded Dragon",
        "topic": "Humidity",
        "text": (
            "Bearded dragons evolved in arid Australian scrubland. Target 30-40% ambient humidity. "
            "Sustained humidity above 50% encourages yellow fungus disease and respiratory "
            "infection. A shallow water dish + weekly soaking is enough; do not mist enclosure."
        ),
        "source": "ASDM · Beardie Habitat",
        "priority": 7,
    },

    # ------------------------------------------------------------------ Cross-species
    {
        "species": "ANY",
        "topic": "Soil rehydration timing",
        "text": (
            "Substrate moisture must be combined with elapsed time, not just humidity readings. "
            "Bioactive setups and coco-fiber substrates dry from the top down, so surface RH can read "
            "low while deeper layers stay damp. The Exotic OS rule is: if humidity has trended "
            "downward for more than 24 hours AND no rehydration event has been logged in 36+ hours, "
            "alert the keeper. Add water in 250-500ml increments to avoid waterlogging."
        ),
        "source": "Exotic OS PRD · Soil Rehydration Origin Story",
        "priority": 10,
    },
    {
        "species": "ANY",
        "topic": "Triple-redundant safety",
        "text": (
            "Every Exotic OS node ships with three independent safety layers: (1) software dead-man "
            "in the ESPHome PID loop with output cap and watchdog, (2) hardware over-temp comparator "
            "(LM393) wired to the SSR, (3) inline thermal fuse on the mains side. Each relay is "
            "smoke-test verified before every kit ships. Relays default to OFF on "
            "power restore — this is non-negotiable."
        ),
        "source": "Exotic OS PRD · Safety Architecture",
        "priority": 9,
    },
    {
        "species": "ANY",
        "topic": "Veterinary escalation",
        "text": (
            "The AI advisor never diagnoses medical conditions. Symptoms that require an exotic vet "
            "(not a regular small-animal vet): refusing food for >2 months with weight loss, "
            "respiratory clicks or open-mouth breathing, persistent gaping, prolapse, swollen or "
            "discolored mouth, neurological signs (head tilt, star-gazing), unusual lethargy. "
            "Locate an ARAV-certified vet (arav.org) before you need one."
        ),
        "source": "ARAV · Find a Vet",
        "priority": 10,
    },
]
