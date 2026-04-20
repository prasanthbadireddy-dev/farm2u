"""
routes/farmer_routes.py — Farmer crop details API.
"""
import json
import os
import uuid
import random
from datetime import datetime
from fastapi import APIRouter  # pyre-ignore[21]
from pydantic import BaseModel  # pyre-ignore[21]
from typing import Optional

router = APIRouter(prefix="/api/farmer")

USERS_FILE = os.path.join(os.path.dirname(__file__), "..", "users.json")
CROPS_FILE = os.path.join(os.path.dirname(__file__), "..", "crops.json")
NOTIFICATIONS_FILE = os.path.join(os.path.dirname(__file__), "..", "notifications.json")


def _load_notifications():
    if os.path.exists(NOTIFICATIONS_FILE):
        with open(NOTIFICATIONS_FILE, "r") as f:
            return json.load(f)
    return []

def _save_notifications(data):
    with open(NOTIFICATIONS_FILE, "w") as f:
        json.dump(data, f, indent=2)


def _load_crops():
    if os.path.exists(CROPS_FILE):
        with open(CROPS_FILE, "r") as f:
            return json.load(f)
    return []


def _save_crops(data):
    with open(CROPS_FILE, "w") as f:
        json.dump(data, f, indent=2)


class FarmerDetailsRequest(BaseModel):
    farmer_id: str
    name: str = ""
    mobile: str = ""
    district: str
    vegetable: str
    quantity: float
    price: Optional[float] = None
    unit: str = "kg"
    lat: Optional[float] = None
    lon: Optional[float] = None


class UpdateQuantityRequest(BaseModel):
    quantity: float


class UpdatePriceRequest(BaseModel):
    price: float
    predicted_price: Optional[float] = None  # for validation


class BuyRequest(BaseModel):
    quantity: float  # quantity to purchase
    delivery_mode: str = "Self-Pick"
    consumer_name: str = "Anonymous"
    consumer_mobile: str = "N/A"


@router.post("/details")
def submit_farmer_details(req: FarmerDetailsRequest):
    crops = _load_crops()
    entry = req.dict()

    # Assign a unique ID to this crop listing
    entry["id"] = str(uuid.uuid4())

    # Backend fallback: Look up name/mobile if frontend didn't send them
    if not entry.get("name") or not entry.get("mobile"):
        try:
            with open(USERS_FILE, "r") as f:
                users = json.load(f)
            for email, profile in users.get("farmers", {}).items():
                if profile.get("id") == req.farmer_id:
                    if not entry.get("name"): entry["name"] = profile.get("name", "")
                    if not entry.get("mobile"): entry["mobile"] = profile.get("mobile", "")
                    break
        except Exception as e:
            print(f"Auth lookup error: {e}")

    crops.append(entry)
    _save_crops(crops)
    return {"success": True, "message": "Crop details saved successfully", "entry": entry}


@router.patch("/crop/{crop_id}/quantity")
def update_crop_quantity(crop_id: str, req: UpdateQuantityRequest):
    """Farmer updates quantity of an existing listing."""
    crops = _load_crops()
    for crop in crops:
        if crop.get("id") == crop_id:
            if req.quantity < 0:
                return {"success": False, "message": "Quantity cannot be negative"}
            crop["quantity"] = req.quantity
            _save_crops(crops)
            return {"success": True, "crop": crop}
    return {"success": False, "message": "Crop not found"}


@router.patch("/crop/{crop_id}/price")
def update_crop_price(crop_id: str, req: UpdatePriceRequest):
    """Farmer updates price of an existing listing (cannot exceed predicted_price)."""
    crops = _load_crops()
    for crop in crops:
        if crop.get("id") == crop_id:
            # Validate against ML predicted cap if provided
            if req.predicted_price is not None and req.price > req.predicted_price:
                return {"success": False, "message": f"Price cannot exceed predicted market price of ₹{req.predicted_price}"}
            if req.price < 0:
                return {"success": False, "message": "Price cannot be negative"}
            crop["price"] = req.price
            _save_crops(crops)
            return {"success": True, "crop": crop}
    return {"success": False, "message": "Crop not found"}


@router.post("/crop/{crop_id}/buy")
def buy_crop(crop_id: str, req: BuyRequest):
    """Consumer buys from a listing; deducts quantity. Removes listing if fully purchased."""
    if crop_id.startswith("csv-"):
        # CSV farmers are virtual and dynamically regenerated. Just fake a successful purchase 
        # so the user can complete the UI flow and get their bill.
        return {"success": True, "remaining_quantity": 999}

    crops = _load_crops()
    for i, crop in enumerate(crops):
        if crop.get("id") == crop_id:
            available = float(crop.get("quantity", 0))
            if req.quantity > available:
                return {"success": False, "message": f"Only {available} kg available"}
            
            crop["quantity"] = round(available - req.quantity, 2)
            
            # Log Notification
            notifications = _load_notifications()
            notif = {
                "id": str(uuid.uuid4()),
                "farmer_id": crop.get("farmer_id"),
                "consumer_name": req.consumer_name,
                "consumer_mobile": req.consumer_mobile,
                "crop_name": crop.get("vegetable"),
                "quantity": req.quantity,
                "delivery_mode": req.delivery_mode,
                "timestamp": datetime.now().isoformat(),
                "read": False
            }
            notifications.append(notif)
            _save_notifications(notifications)

            if crop["quantity"] <= 0:
                crops.pop(i)
            _save_crops(crops)
            return {"success": True, "remaining_quantity": crop.get("quantity", 0)}
    return {"success": False, "message": "Crop not found"}


@router.get("/notifications")
def get_notifications(farmer_id: str):
    notifications = _load_notifications()
    farmer_notifs = [n for n in notifications if n.get("farmer_id") == farmer_id]
    
    # Sort reverse cronologically
    farmer_notifs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
    return {"success": True, "notifications": farmer_notifs[:50]}  # Return latest 50

@router.patch("/notifications/{notif_id}/read")
def mark_notification_read(notif_id: str):
    notifications = _load_notifications()
    for n in notifications:
        if n.get("id") == notif_id:
            n["read"] = True
            _save_notifications(notifications)
            return {"success": True}
    return {"success": False}


@router.get("/crops")
def get_farmer_crops(farmer_id: str):
    crops = _load_crops()
    farmer_crops = [c for c in crops if c.get("farmer_id") == farmer_id]
    return {"success": True, "crops": farmer_crops}


@router.get("/all-crops")
def get_all_crops():
    """Return all farmer-submitted crops (used by recommendations)."""
    crops = _load_crops()
    return {"success": True, "crops": crops}
