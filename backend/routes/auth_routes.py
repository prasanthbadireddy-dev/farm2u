"""
routes/auth_routes.py — Farmer and Consumer authentication endpoints.
"""
from fastapi import APIRouter  # pyre-ignore[21]
from pydantic import BaseModel  # pyre-ignore[21]
from auth import (  # pyre-ignore[21]
    farmer_signup, farmer_login, consumer_signup, consumer_login,
    farmer_reset_password, consumer_reset_password,
)

router = APIRouter(prefix="/api")


# ── Pydantic Models ───────────────────────────────────────────────────────

class FarmerSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    mobile: str = ""


class LoginRequest(BaseModel):
    email: str
    password: str


class ConsumerSignupRequest(BaseModel):
    name: str
    email: str
    password: str
    mobile: str = ""
    location: str = ""


class ResetPasswordRequest(BaseModel):
    email: str
    new_password: str


# ── Farmer Auth ───────────────────────────────────────────────────────────

@router.post("/farmer/signup")
def api_farmer_signup(req: FarmerSignupRequest):
    result = farmer_signup(req.name, req.email, req.password, req.mobile)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, "user": result}


@router.post("/farmer/login")
def api_farmer_login(req: LoginRequest):
    result = farmer_login(req.email, req.password)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, **result}


@router.post("/farmer/reset-password")
def api_farmer_reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters"}
    result = farmer_reset_password(req.email, req.new_password)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, "message": "Password reset successfully! Please sign in."}


# ── Consumer Auth ─────────────────────────────────────────────────────────

@router.post("/consumer/signup")
def api_consumer_signup(req: ConsumerSignupRequest):
    result = consumer_signup(req.name, req.email, req.password, req.mobile, req.location)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, "user": result}


@router.post("/consumer/login")
def api_consumer_login(req: LoginRequest):
    result = consumer_login(req.email, req.password)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, **result}


@router.post("/consumer/reset-password")
def api_consumer_reset_password(req: ResetPasswordRequest):
    if len(req.new_password) < 6:
        return {"success": False, "message": "Password must be at least 6 characters"}
    result = consumer_reset_password(req.email, req.new_password)
    if "error" in result:
        return {"success": False, "message": result["error"]}
    return {"success": True, "message": "Password reset successfully! Please sign in."}

