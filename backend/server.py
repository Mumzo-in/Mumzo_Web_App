from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator
from typing import List, Optional
import re

# Hyderabad + Secunderabad pincodes fall in 500xxx and 501xxx (Telangana)
HYDERABAD_PINCODE_RE = re.compile(r"^(500|501)\d{3}$")
import uuid
from datetime import datetime, timezone


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

app = FastAPI(title="Mumzo API")
api_router = APIRouter(prefix="/api")


# ---------- Models ----------
class WaitlistCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=120)
    email: EmailStr
    address: str = Field(..., min_length=3, max_length=500)
    pincode: str = Field(..., min_length=6, max_length=6)
    baby_name: str = Field(..., min_length=1, max_length=120)
    baby_age: str = Field(..., min_length=1, max_length=40)

    @field_validator("pincode")
    @classmethod
    def validate_pincode(cls, v: str) -> str:
        v = v.strip()
        if not re.fullmatch(r"\d{6}", v):
            raise ValueError("Pincode must be a 6-digit number.")
        return v


class WaitlistEntry(BaseModel):
    model_config = ConfigDict(extra="ignore")

    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    address: str
    pincode: str
    baby_name: str
    baby_age: str
    is_hyderabad: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class WaitlistResponse(BaseModel):
    id: str
    position: int
    is_hyderabad: bool
    message: str


# ---------- Routes ----------
@api_router.get("/")
async def root():
    return {"message": "Mumzo API — delivering with love"}


@api_router.post("/waitlist", response_model=WaitlistResponse)
async def join_waitlist(payload: WaitlistCreate):
    is_hyderabad = bool(HYDERABAD_PINCODE_RE.match(payload.pincode))

    # Check dupe by email
    existing = await db.waitlist.find_one({"email": payload.email.lower()})
    if existing:
        count = await db.waitlist.count_documents({})
        existing_hyd = bool(existing.get("is_hyderabad"))
        return WaitlistResponse(
            id=existing["id"],
            position=count,
            is_hyderabad=existing_hyd,
            message=(
                "You're already on the list, mama. We'll be in touch soon."
                if existing_hyd
                else "You're already on our future-cities list. We'll ping the moment Mumzo arrives near you."
            ),
        )

    entry = WaitlistEntry(
        name=payload.name.strip(),
        email=payload.email.lower().strip(),
        address=payload.address.strip(),
        pincode=payload.pincode.strip(),
        baby_name=payload.baby_name.strip(),
        baby_age=payload.baby_age.strip(),
        is_hyderabad=is_hyderabad,
    )

    doc = entry.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()

    await db.waitlist.insert_one(doc)
    position = await db.waitlist.count_documents({})

    if is_hyderabad:
        message = "Welcome to the Mumzo family. We'll see you soon in Hyderabad."
    else:
        message = (
            "We're not in your city yet, mama — but you're on our future-cities list. "
            "We'll ping you the moment Mumzo comes near you."
        )

    return WaitlistResponse(
        id=entry.id,
        position=position,
        is_hyderabad=is_hyderabad,
        message=message,
    )


@api_router.get("/waitlist/pincode-check")
async def pincode_check(pincode: str):
    pincode = (pincode or "").strip()
    if not re.fullmatch(r"\d{6}", pincode):
        return {"valid": False, "is_hyderabad": False, "message": "Enter a 6-digit pincode."}
    return {
        "valid": True,
        "is_hyderabad": bool(HYDERABAD_PINCODE_RE.match(pincode)),
    }


@api_router.get("/waitlist/count")
async def waitlist_count():
    count = await db.waitlist.count_documents({})
    return {"count": count}


@api_router.get("/waitlist", response_model=List[WaitlistEntry])
async def list_waitlist():
    entries = await db.waitlist.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
    for e in entries:
        if isinstance(e.get("created_at"), str):
            e["created_at"] = datetime.fromisoformat(e["created_at"])
    return entries


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
