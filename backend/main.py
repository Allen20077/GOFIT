import os
import uuid
import asyncio
from datetime import datetime, timezone, timedelta
from typing import Optional
import hashlib
import secrets

from dotenv import load_dotenv

from fastapi import (
    FastAPI,
    HTTPException,
    WebSocket,
    WebSocketDisconnect,
    Query,
    UploadFile,
    File,
)

from fastapi.middleware.cors import CORSMiddleware

from pydantic import BaseModel, Field

from supabase import create_client

from groq import Groq

from jose import jwt, JWTError


# =========================================================
# LOAD ENVIRONMENT
# =========================================================

load_dotenv()


SUPABASE_URL = os.getenv("SUPABASE_URL")

SUPABASE_SECRET_KEY = os.getenv(
    "SUPABASE_SECRET_KEY"
)

GROQ_API_KEY = os.getenv("GROQ_API_KEY")
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv(
    "RESEND_FROM_EMAIL",
    "onboarding@resend.dev"
)

GROQ_MODEL = os.getenv(
    "GROQ_MODEL",
    "llama-3.3-70b-versatile"
)

ADMIN_PHONE = "".join(
    character
    for character in os.getenv("ADMIN_PHONE", "")
    if character.isdigit()
)[-10:]

ADMIN_PASSWORD = os.getenv(
    "ADMIN_PASSWORD"
)

JWT_SECRET = os.getenv(
    "JWT_SECRET"
)

JWT_ALGORITHM = "HS256"


# =========================================================
# VALIDATE ENVIRONMENT
# =========================================================

if not SUPABASE_URL:
    print("WARNING: SUPABASE_URL is missing")

if not SUPABASE_SECRET_KEY:
    print("WARNING: SUPABASE_SECRET_KEY is missing")

if not ADMIN_PHONE:
    print("WARNING: ADMIN_PHONE is missing")

if not ADMIN_PASSWORD:
    print("WARNING: ADMIN_PASSWORD is missing")

if not JWT_SECRET:
    print("WARNING: JWT_SECRET is missing")


# =========================================================
# CLIENTS
# =========================================================

supabase = None

groq_client = None


if SUPABASE_URL and SUPABASE_SECRET_KEY:

    supabase = create_client(
        SUPABASE_URL,
        SUPABASE_SECRET_KEY
    )


if GROQ_API_KEY:

    groq_client = Groq(
        api_key=GROQ_API_KEY
    )


# =========================================================
# FASTAPI
# =========================================================

app = FastAPI(
    title="GoFit API",
    version="2.0.0"
)


# =========================================================
# CORS
# =========================================================

cors_origins = os.getenv(
    "CORS_ORIGINS",
    "http://localhost:5173"
).split(",")


app.add_middleware(
    CORSMiddleware,

    allow_origins=[
        origin.strip()
        for origin in cors_origins
    ],

    allow_credentials=True,

    allow_methods=["*"],

    allow_headers=["*"]
)


# =========================================================
# REALTIME CONNECTIONS
# =========================================================

admin_connections = []

order_connections = {}


# =========================================================
# ORDER STATUSES
# =========================================================

VALID_STATUSES = {
    "received",
    "confirmed",
    "preparing",
    "ready",
    "out_for_delivery",
    "completed",
    "cancelled",
    "rejected"
}


# =========================================================
# MODELS
# =========================================================

class LoginRequest(BaseModel):

    phone: str

    password: str


class Order(BaseModel):

    customer_name: str

    phone: str

    pickup_location: str

    pickup_slot: str = "Delivery"

    quantity: int = Field(
        ge=1,
        le=20
    )

    product_name: str = "GoFit Regular Box"

    unit_price: float = 89

    addons: list = []

    addon_total: float = 0

    packaging_fee: float = 10

    delivery_fee: float = 0

    total_amount: float

    payment_method: str = "COD"

    payment_status: str = "pending"


class AIRequest(BaseModel):

    message: str


class StatusUpdate(BaseModel):

    status: str


class ReasonRequest(BaseModel):

    reason: Optional[str] = None
class ProfileUpdate(BaseModel):
    name: str
    email: str
    bio: str = ""


class SendOTPRequest(BaseModel):
    email: str


class VerifyOTPRequest(BaseModel):
    email: str
    otp: str

# =========================================================
# JWT
# =========================================================

def create_admin_token():

    if not JWT_SECRET:

        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured"
        )

    payload = {

        "role": "admin",

        "phone": ADMIN_PHONE,

        "exp":
            datetime.now(
                timezone.utc
            ) + timedelta(hours=12)
    }

    return jwt.encode(
        payload,
        JWT_SECRET,
        algorithm=JWT_ALGORITHM
    )


def verify_admin_token(token: str):

    if not JWT_SECRET:

        raise HTTPException(
            status_code=500,
            detail="JWT_SECRET is not configured"
        )

    try:

        payload = jwt.decode(
            token,
            JWT_SECRET,
            algorithms=[JWT_ALGORITHM]
        )

        if payload.get("role") != "admin":

            raise HTTPException(
                status_code=403,
                detail="Admin access required"
            )

        return payload

    except JWTError:

        raise HTTPException(
            status_code=401,
            detail="Invalid or expired admin token"
        )

# =========================================================
# CUSTOMER PROFILE HELPERS
# =========================================================

def clean_phone_number(phone: str) -> str:

    return "".join(
        character
        for character in phone
        if character.isdigit()
    )[-10:]


def hash_otp(otp: str) -> str:

    return hashlib.sha256(
        otp.encode("utf-8")
    ).hexdigest()


def generate_otp() -> str:

    return f"{secrets.randbelow(1000000):06d}"


def get_customer_profile(phone: str):

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    result = (
        supabase
        .table("customer_profiles")
        .select("*")
        .eq("phone", phone)
        .maybe_single()
        .execute()
    )

    return result.data
# =========================================================
# REALTIME BROADCAST
# =========================================================

async def broadcast_admin(message: dict):

    disconnected = []

    for websocket in admin_connections:

        try:

            await websocket.send_json(
                message
            )

        except Exception:

            disconnected.append(
                websocket
            )

    for websocket in disconnected:

        if websocket in admin_connections:

            admin_connections.remove(
                websocket
            )


async def broadcast_order(
    order_id: str,
    message: dict
):

    connections = order_connections.get(
        order_id,
        []
    )

    disconnected = []

    for websocket in connections:

        try:

            await websocket.send_json(
                message
            )

        except Exception:

            disconnected.append(
                websocket
            )

    for websocket in disconnected:

        if websocket in connections:

            connections.remove(
                websocket
            )


# =========================================================
# HOME
# =========================================================

@app.get("/")
def home():

    return {

        "app": "GoFit",

        "status": "running",

        "version": "2.0.0"
    }


# =========================================================
# HEALTH
# =========================================================

@app.get("/api/health")
def health():

    return {

        "backend": True,

        "supabase":
            supabase is not None,

        "groq":
            groq_client is not None,

        "admin":
            bool(
                ADMIN_PHONE
                and ADMIN_PASSWORD
            )
    }


# =========================================================
# LOGIN
# =========================================================

@app.post("/api/auth/login")
def login(request: LoginRequest):

    clean_phone = "".join(
        character
        for character in request.phone
        if character.isdigit()
    )

    # -----------------------------------------------------
    # ADMIN LOGIN
    # -----------------------------------------------------

    if (
        ADMIN_PHONE
        and ADMIN_PASSWORD
        and clean_phone == ADMIN_PHONE
        and request.password == ADMIN_PASSWORD
    ):

        token = create_admin_token()

        return {

            "success": True,

            "user": {

                "name": "GoFit Admin",

                "phone": clean_phone,

                "role": "admin"
            },

            "token": token
        }

    # -----------------------------------------------------
    # CUSTOMER LOGIN
    # -----------------------------------------------------

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Enter a valid 10-digit phone number"
        )

    return {

        "success": True,

        "user": {

            "name": "GoFit Customer",

            "phone": clean_phone,

            "role": "customer"
        }
    }


# =========================================================
# CREATE ORDER
# =========================================================

@app.post("/api/orders")
async def create_order(order: Order):

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    order_id = str(
        uuid.uuid4()
    )

    now = datetime.now(
        timezone.utc
    ).isoformat()

    order_data = {

        "id": order_id,

        "customer_name":
            order.customer_name,

        "phone":
            order.phone,

        "pickup_location":
            order.pickup_location,

        "pickup_slot":
            order.pickup_slot,

        "quantity":
            order.quantity,

        "product_name":
            order.product_name,

        "unit_price":
            order.unit_price,

        "addons":
            order.addons,

        "addon_total":
            order.addon_total,

        "packaging_fee":
            order.packaging_fee,

        "delivery_fee":
            order.delivery_fee,

        "total_amount":
            order.total_amount,

        "payment_method":
            order.payment_method,

        "payment_status":
            order.payment_status,

        "product_id":
            "gofit-regular",

        "status":
            "received",

        "created_at":
            now,

        "updated_at":
            now
    }

    try:

        result = (
            supabase
            .table("orders")
            .insert(order_data)
            .execute()
        )

        if not result.data:

            raise HTTPException(
                status_code=500,
                detail="Order was not created"
            )

        new_order = result.data[0]

        # Notify admin dashboard
        await broadcast_admin({

            "type":
                "new_order",

            "order":
                new_order
        })

        return new_order

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )

# =========================================================
# CUSTOMER PROFILE
# =========================================================

@app.get("/api/profile/{phone}")
def get_profile(phone: str):

    clean_phone = clean_phone_number(phone)

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )

    profile = get_customer_profile(
        clean_phone
    )

    if not profile:

        profile = {
            "phone": clean_phone,
            "name": "GoFit Customer",
            "email": "",
            "email_verified": False,
            "bio": "",
            "profile_photo_url": None
        }

    return profile
@app.put("/api/profile/{phone}")
def update_profile(
    phone: str,
    profile: ProfileUpdate
):

    clean_phone = clean_phone_number(
        phone
    )

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )

    if not profile.name.strip():

        raise HTTPException(
            status_code=400,
            detail="Name is required"
        )

    if not profile.email.strip():

        raise HTTPException(
            status_code=400,
            detail="Email is required"
        )

    existing = get_customer_profile(
        clean_phone
    )

    existing_email = (
        existing.get("email", "")
        if existing
        else ""
    )

    # If the email changed,
    # it must be verified again.
    if (
        existing_email
        and
        existing_email.lower()
        != profile.email.strip().lower()
    ):

        email_verified = False

    else:

        email_verified = (
            existing.get(
                "email_verified",
                False
            )
            if existing
            else False
        )

    profile_data = {

        "phone":
            clean_phone,

        "name":
            profile.name.strip(),

        "email":
            profile.email.strip().lower(),

        "email_verified":
            email_verified,

        "bio":
            profile.bio.strip(),

        "updated_at":
            datetime.now(
                timezone.utc
            ).isoformat()
    }

    result = (
        supabase
        .table("customer_profiles")
        .upsert(
            profile_data,
            on_conflict="phone"
        )
        .execute()
    )

    if not result.data:

        raise HTTPException(
            status_code=500,
            detail="Profile could not be saved"
        )

    return result.data[0]
@app.post("/api/profile/{phone}/send-otp")
def send_profile_otp(
    phone: str,
    request: SendOTPRequest
):

    if not RESEND_API_KEY:

        raise HTTPException(
            status_code=500,
            detail="RESEND_API_KEY is not configured"
        )

    clean_phone = clean_phone_number(
        phone
    )

    email = (
        request.email
        .strip()
        .lower()
    )

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )

    if (
        "@" not in email
        or "." not in email
    ):

        raise HTTPException(
            status_code=400,
            detail="Enter a valid email address"
        )

    otp = generate_otp()

    otp_hash = hash_otp(otp)

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(minutes=10)
    )

    # Delete previous OTPs
    (
        supabase
        .table("profile_otps")
        .delete()
        .eq("phone", clean_phone)
        .execute()
    )

    # Save new OTP
    (
        supabase
        .table("profile_otps")
        .insert({

            "phone":
                clean_phone,

            "email":
                email,

            "otp_hash":
                otp_hash,

            "expires_at":
                expires_at.isoformat(),

            "verified":
                False,

            "attempts":
                0
        })
        .execute()
    )

    try:

        import resend

        resend.api_key = RESEND_API_KEY

        resend.Emails.send({

            "from":
                RESEND_FROM_EMAIL,

            "to":
                [email],

            "subject":
                "GoFit Email Verification OTP",

            "html":
                f"""
                <div style="
                    font-family:Arial;
                    padding:30px;
                    background:#081321;
                    color:white;
                ">

                    <h2 style="
                        color:#0fc58a;
                    ">
                        GoFit Protein
                    </h2>

                    <p>
                        Your GoFit
                        verification code is:
                    </p>

                    <h1 style="
                        color:#0fc58a;
                        letter-spacing:8px;
                    ">
                        {otp}
                    </h1>

                    <p>
                        This code expires
                        in 10 minutes.
                    </p>

                    <p>
                        If you did not request
                        this code, ignore this email.
                    </p>

                </div>
                """
        })

    except Exception as e:

        print(
            "OTP EMAIL ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to send verification email"
        )

    return {

        "success":
            True,

        "message":
            "OTP sent to your email"
    }


@app.post("/api/profile/{phone}/verify-otp")
def verify_profile_otp(
    phone: str,
    request: VerifyOTPRequest
):

    clean_phone = clean_phone_number(
        phone
    )

    email = (
        request.email
        .strip()
        .lower()
    )

    otp = request.otp.strip()

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )

    if (
        len(otp) != 6
        or not otp.isdigit()
    ):

        raise HTTPException(
            status_code=400,
            detail="Enter the 6-digit OTP"
        )

    result = (
        supabase
        .table("profile_otps")
        .select("*")
        .eq("phone", clean_phone)
        .eq("email", email)
        .eq("verified", False)
        .order(
            "created_at",
            desc=True
        )
        .limit(1)
        .execute()
    )

    if not result.data:

        raise HTTPException(
            status_code=400,
            detail="OTP not found. Request a new OTP."
        )

    record = result.data[0]

    if record.get(
        "attempts",
        0
    ) >= 5:

        raise HTTPException(
            status_code=429,
            detail="Too many attempts. Request a new OTP."
        )

    expires_at = datetime.fromisoformat(
        record["expires_at"]
        .replace("Z", "+00:00")
    )

    if (
        datetime.now(timezone.utc)
        > expires_at
    ):

        raise HTTPException(
            status_code=400,
            detail="OTP expired. Request a new one."
        )

    if hash_otp(otp) != record["otp_hash"]:

        (
            supabase
            .table("profile_otps")
            .update({
                "attempts":
                    record.get(
                        "attempts",
                        0
                    ) + 1
            })
            .eq(
                "id",
                record["id"]
            )
            .execute()
        )

        raise HTTPException(
            status_code=400,
            detail="Incorrect OTP"
        )

    # Mark OTP as verified
    (
        supabase
        .table("profile_otps")
        .update({
            "verified": True
        })
        .eq(
            "id",
            record["id"]
        )
        .execute()
    )

    # Update profile
    profile_result = (
        supabase
        .table("customer_profiles")
        .upsert({

            "phone":
                clean_phone,

            "email":
                email,

            "email_verified":
                True,

            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat()

        }, on_conflict="phone")
        .execute()
    )

    return {

        "success":
            True,

        "message":
            "Email verified successfully",

        "profile":
            profile_result.data[0]
            if profile_result.data
            else None
    }


@app.post("/api/profile/{phone}/photo")
async def upload_profile_photo(
    phone: str,
    file: UploadFile = File(...)
):

    clean_phone = clean_phone_number(
        phone
    )

    if len(clean_phone) != 10:

        raise HTTPException(
            status_code=400,
            detail="Invalid phone number"
        )

    allowed_types = {

        "image/jpeg",
        "image/png",
        "image/webp"
    }

    if file.content_type not in allowed_types:

        raise HTTPException(
            status_code=400,
            detail="Only JPG, PNG and WEBP images are allowed"
        )

    contents = await file.read()

    if len(contents) > 5 * 1024 * 1024:

        raise HTTPException(
            status_code=400,
            detail="Image must be smaller than 5MB"
        )

    extension = (
        file.filename
        .split(".")[-1]
        .lower()
        if file.filename
        and "." in file.filename
        else "jpg"
    )

    # Unique filename prevents browser caching
    path = (
        f"{clean_phone}/"
        f"profile-{uuid.uuid4().hex}."
        f"{extension}"
    )

    try:

        (
            supabase
            .storage
            .from_("gofit-profiles")
            .upload(
                path,
                contents,
                {
                    "content-type":
                        file.content_type
                }
            )
        )

    except Exception as e:

        print(
            "PROFILE PHOTO ERROR:",
            e
        )

        raise HTTPException(
            status_code=500,
            detail="Unable to upload profile photo"
        )

    public_url = (
        f"{SUPABASE_URL}"
        f"/storage/v1/object/public/"
        f"gofit-profiles/"
        f"{path}"
    )

    result = (
        supabase
        .table("customer_profiles")
        .upsert({

            "phone":
                clean_phone,

            "profile_photo_url":
                public_url,

            "updated_at":
                datetime.now(
                    timezone.utc
                ).isoformat()

        }, on_conflict="phone")
        .execute()
    )

    return {

        "success":
            True,

        "profile_photo_url":
            public_url,

        "profile":
            result.data[0]
            if result.data
            else None
    }
# =========================================================
# GET ALL ORDERS - ADMIN
# =========================================================

@app.get("/api/admin/orders")
def get_admin_orders(
    token: str = Query(...)
):

    verify_admin_token(token)

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    try:

        result = (
            supabase
            .table("orders")
            .select("*")
            .order(
                "created_at",
                desc=True
            )
            .execute()
        )

        return {

            "orders":
                result.data or []
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# GET SINGLE ORDER
# =========================================================

@app.get("/api/orders/{order_id}")
def get_order(
    order_id: str
):

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    try:

        result = (
            supabase
            .table("orders")
            .select("*")
            .eq(
                "id",
                order_id
            )
            .single()
            .execute()
        )

        if not result.data:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        return result.data

    except HTTPException:

        raise

    except Exception:

        raise HTTPException(
            status_code=404,
            detail="Order not found"
        )


# =========================================================
# UPDATE ORDER STATUS
# =========================================================

@app.patch(
    "/api/admin/orders/{order_id}/status"
)
async def update_order_status(
    order_id: str,
    data: StatusUpdate,
    token: str = Query(...)
):

    verify_admin_token(token)

    if data.status not in VALID_STATUSES:

        raise HTTPException(
            status_code=400,
            detail="Invalid order status"
        )

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    try:

        result = (
            supabase
            .table("orders")
            .update({

                "status":
                    data.status,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat()
            })
            .eq(
                "id",
                order_id
            )
            .execute()
        )

        if not result.data:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        updated_order = result.data[0]

        # Admin realtime
        await broadcast_admin({

            "type":
                "order_updated",

            "order":
                updated_order
        })

        # Customer realtime
        await broadcast_order(
            order_id,
            {

                "type":
                    "order_updated",

                "order":
                    updated_order
            }
        )

        return updated_order

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# REJECT ORDER
# =========================================================

@app.patch(
    "/api/admin/orders/{order_id}/reject"
)
async def reject_order(
    order_id: str,
    data: ReasonRequest,
    token: str = Query(...)
):

    verify_admin_token(token)

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    reason = (
        data.reason
        or
        "Rejected by GoFit admin"
    )

    try:

        result = (
            supabase
            .table("orders")
            .update({

                "status":
                    "rejected",

                "rejection_reason":
                    reason,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat()
            })
            .eq(
                "id",
                order_id
            )
            .execute()
        )

        if not result.data:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        updated_order = result.data[0]

        await broadcast_admin({

            "type":
                "order_rejected",

            "order":
                updated_order
        })

        await broadcast_order(
            order_id,
            {

                "type":
                    "order_rejected",

                "order":
                    updated_order
            }
        )

        return updated_order

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# CANCEL ORDER
# =========================================================

@app.patch(
    "/api/admin/orders/{order_id}/cancel"
)
async def cancel_order(
    order_id: str,
    data: ReasonRequest,
    token: str = Query(...)
):

    verify_admin_token(token)

    if not supabase:

        raise HTTPException(
            status_code=500,
            detail="Supabase is not configured"
        )

    reason = (
        data.reason
        or
        "Cancelled by GoFit admin"
    )

    try:

        result = (
            supabase
            .table("orders")
            .update({

                "status":
                    "cancelled",

                "cancellation_reason":
                    reason,

                "updated_at":
                    datetime.now(
                        timezone.utc
                    ).isoformat()
            })
            .eq(
                "id",
                order_id
            )
            .execute()
        )

        if not result.data:

            raise HTTPException(
                status_code=404,
                detail="Order not found"
            )

        updated_order = result.data[0]

        await broadcast_admin({

            "type":
                "order_cancelled",

            "order":
                updated_order
        })

        await broadcast_order(
            order_id,
            {

                "type":
                    "order_cancelled",

                "order":
                    updated_order
            }
        )

        return updated_order

    except HTTPException:

        raise

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )


# =========================================================
# ADMIN REALTIME WEBSOCKET
# =========================================================

@app.websocket("/ws/admin")
async def admin_websocket(
    websocket: WebSocket
):

    await websocket.accept()

    authenticated = False

    try:

        # First message must contain token
        message = await websocket.receive_json()

        token = message.get(
            "token"
        )

        if not token:

            await websocket.close(
                code=1008
            )

            return

        try:

            verify_admin_token(
                token
            )

            authenticated = True

        except Exception:

            await websocket.close(
                code=1008
            )

            return

        if authenticated:

            admin_connections.append(
                websocket
            )

            await websocket.send_json({

                "type":
                    "connected",

                "message":
                    "GoFit admin realtime connected"
            })

            while True:

                await websocket.receive_text()

    except WebSocketDisconnect:

        pass

    except Exception as e:

        print(
            "Admin websocket error:",
            e
        )

    finally:

        if websocket in admin_connections:

            admin_connections.remove(
                websocket
            )


# =========================================================
# CUSTOMER ORDER WEBSOCKET
# =========================================================

@app.websocket(
    "/ws/orders/{order_id}"
)
async def order_websocket(
    websocket: WebSocket,
    order_id: str
):

    await websocket.accept()

    if order_id not in order_connections:

        order_connections[
            order_id
        ] = []

    order_connections[
        order_id
    ].append(
        websocket
    )

    try:

        await websocket.send_json({

            "type":
                "connected",

            "order_id":
                order_id
        })

        while True:

            await websocket.receive_text()

    except WebSocketDisconnect:

        pass

    except Exception as e:

        print(
            "Order websocket error:",
            e
        )

    finally:

        if order_id in order_connections:

            if websocket in order_connections[
                order_id
            ]:

                order_connections[
                    order_id
                ].remove(
                    websocket
                )

            if not order_connections[
                order_id
            ]:

                del order_connections[
                    order_id
                ]


# =========================================================
# AI CHAT
# =========================================================

@app.post("/api/ai")
def ai_chat(
    request: AIRequest
):

    if not groq_client:

        raise HTTPException(
            status_code=500,
            detail="Groq API is not configured"
        )

    system_prompt = """

You are GoFit AI.

GoFit has ONLY ONE PRODUCT:

GoFit Regular Box - ₹89.

The box contains:

- Protein oats
- Sprouts
- Cucumber
- Roasted chana
- Roasted peanuts
- Apple
- Banana
- Peanut butter

Packaging fee is ₹10.

Campus delivery is currently FREE.

Answer users in a friendly and concise way.

Never invent another GoFit product.

"""

    try:

        response = (
            groq_client
            .chat
            .completions
            .create(

                model=GROQ_MODEL,

                messages=[

                    {
                        "role":
                            "system",

                        "content":
                            system_prompt
                    },

                    {
                        "role":
                            "user",

                        "content":
                            request.message
                    }

                ],

                temperature=0.4
            )
        )

        answer = (
            response
            .choices[0]
            .message
            .content
        )

        return {

            "answer":
                answer
        }

    except Exception as e:

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )