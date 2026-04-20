"""
routes/data_routes.py — Vegetable search, price prediction, recommendations, districts.
"""
from fastapi import APIRouter, Query  # pyre-ignore[21]
from pydantic import BaseModel
import re
from typing import Optional
import os
import json

router = APIRouter(prefix="/api")

# Loaded lazily from app state (injected after startup)
_state = {}


def set_state(prices_df, production_df, vegs_df, model, encoders,
              get_veg_locations_fn, get_recommendations_fn, predict_price_fn,
              get_all_veg_locations_fn, get_farmers_by_vegetable_fn,
              districts_df, DISTRICTS, VEGETABLES,
              csv_cache=None, csv_cache_lock=None):
    _state.update(
        prices_df=prices_df, production_df=production_df, vegs_df=vegs_df,
        model=model, encoders=encoders,
        get_veg_locations=get_veg_locations_fn,
        get_recommendations=get_recommendations_fn,
        predict_price=predict_price_fn,
        get_all_veg_locations=get_all_veg_locations_fn,
        get_farmers_by_vegetable=get_farmers_by_vegetable_fn,
        districts_df=districts_df,
        DISTRICTS=DISTRICTS,
        VEGETABLES=VEGETABLES,
        csv_cache=csv_cache or {},
        csv_cache_lock=csv_cache_lock,
    )


@router.get("/vegetables")
def get_map_locations(name: Optional[str] = Query(None),
                     district: Optional[str] = Query(None)):
    
    if name and not name.isascii():
        try:
            from deep_translator import GoogleTranslator
            translated_name = GoogleTranslator(source='auto', target='en').translate(name)
            if translated_name:
                name = translated_name
        except:
            pass

    # Enforcement of strict AND logic
    if name:
        rows = _state["get_veg_locations"](name)
        # Ensure we filter market rows strictly by the name if provided
        rows = [r for r in rows if name.lower() in r.get("vegetable", "").lower()]
    else:
        rows = _state["get_all_veg_locations"]()
        
    if district:
        rows = [r for r in rows if district.lower() in r.get("district", "").lower()]
    
    # Historical / Market Data
    result = []
    for r in rows:
        result.append({
            "vegetable": r.get("vegetable", ""),
            "district": r.get("district", ""),
            "lat": r.get("lat", 0),
            "lon": r.get("lon", 0),
            "avg_price": round(r.get("avg_price", 0), 2),
            "type": "Market",
            "farmer_name": "Local Market",
            "mobile": "N/A"
        })
        
    # Live Farmer Data from crops.json
    try:
        from routes.farmer_routes import CROPS_FILE  # pyre-ignore[21]
        if os.path.exists(CROPS_FILE):
            with open(CROPS_FILE, "r") as f:
                all_crops = json.load(f)
            
            districts_df = _state["districts_df"]
            
            for crop in all_crops:
                # Filter by name if provided
                if name and name.lower() not in crop["vegetable"].lower():
                    continue
                if district and district.lower() not in crop["district"].lower():
                    continue
                
                # Dynamic Lookup for contact info if missing
                farmer_name = crop.get("name")
                farmer_mobile = crop.get("mobile")
                
                if not farmer_name or not farmer_mobile:
                    try:
                        with open(os.path.join(os.path.dirname(__file__), "..", "users.json"), "r") as uf:
                            users_data = json.load(uf)
                            for _, prof in users_data.get("farmers", {}).items():
                                if prof.get("id") == crop.get("farmer_id"):
                                    if not farmer_name: farmer_name = prof.get("name", "Unknown")
                                    if not farmer_mobile: farmer_mobile = prof.get("mobile", "N/A")
                                    break
                    except: pass

                # Get exact lat/lon or fallback to district
                if crop.get("lat") is not None and crop.get("lon") is not None:
                    lat = float(crop["lat"])
                    lon = float(crop["lon"])
                else:
                    d_info = districts_df[districts_df["district"] == crop["district"]]
                    lat = float(d_info["latitude"].iloc[0]) if not d_info.empty else 16.0
                    lon = float(d_info["longitude"].iloc[0]) if not d_info.empty else 80.0
                
                # Determine price: use farmer-set price, or fall back to ML predicted price
                raw_price = crop.get("price")
                if raw_price is None:
                    try:
                        prices_df = _state.get("prices_df")
                        if prices_df is not None:
                            vm = prices_df['vegetable'].str.lower() == crop["vegetable"].lower()
                            dm = prices_df['district'].str.lower() == crop["district"].lower()
                            pd_data = prices_df[vm & dm]
                            if not pd_data.empty:
                                raw_price = round(float(pd_data.iloc[0]['avg_price']), 2)
                    except:
                        pass

                result.append({
                    "vegetable": crop["vegetable"],
                    "district": crop["district"],
                    "lat": lat,
                    "lon": lon,
                    "avg_price": raw_price or 0,
                    "price": raw_price,
                    "quantity": crop.get("quantity", 0),
                    "crop_id": crop.get("id", ""),
                    "type": "Farmer",
                    "farmer_name": farmer_name or "Unknown Farmer",
                    "mobile": farmer_mobile or "N/A"
                })
    except Exception as e:
        print(f"Error loading farmer crops: {e}")

    # ── CSV Farmers from the 60-second refreshed cache ─────────────────────────
    try:
        csv_cache = _state.get("csv_cache", {})
        csv_cache_lock = _state.get("csv_cache_lock")
        matched = []
        if csv_cache_lock:
            with csv_cache_lock:
                snapshot = dict(csv_cache)
        else:
            snapshot = dict(csv_cache)

        for (veg_key, dist_key), farmers in snapshot.items():
            if name and name.lower() not in veg_key:
                continue
            if district and district.lower() not in dist_key:
                continue
            matched.extend(farmers)

        result.extend(matched)
    except Exception as e:
        print(f"Error loading CSV farmers: {e}")

    # Priority sorting: Farmer > CSV Farmer > Market
    type_priority = {"Farmer": 0, "CSV Farmer": 1, "Market": 2}
    result.sort(key=lambda x: type_priority.get(x.get("type"), 3))

    return {"success": True, "results": result}


# ── Voice Command Parsing (NLP-lite) ──────────────────────────────────────

class VoiceRequest(BaseModel):
    text: str
    context_district: str = "Guntur"
    lang: str = "en-IN"

def parse_voice_command(text: str, context_district: str):
    text = text.lower().strip()
    # Strip some common punctuation
    import re
    text = re.sub(r'[^\w\s\.]', '', text)
    
    # --- 1. Identify Intent ---
    intent = "unknown"
    if any(w in text for w in ["price", "cost", "predict", "market", "how much", "rate", "value", "worth"]):
        intent = "get_price"
    elif any(w in text for w in ["add", "sell", "have", "list", "listing", "got", "submit", "some", "upload", "put", "register"]):
        intent = "add_crop"
    elif any(w in text for w in ["go to", "navigate", "open", "show", "visit", "take me", "move to"]):
        intent = "navigate"
        
    # Translate numbers
    word_to_num = {
        "one": "1", "two": "2", "three": "3", "four": "4", "five": "5",
        "six": "6", "seven": "7", "eight": "8", "nine": "9", "ten": "10",
        "eleven": "11", "twelve": "12", "twenty": "20", "thirty": "30",
        "forty": "40", "fifty": "50", "sixty": "60", "seventy": "70",
        "eighty": "80", "ninety": "90", "hundred": "100"
    }
    for w, n in word_to_num.items():
        text = re.sub(rf'\b{w}\b', n, text)
        
    qty_match = re.search(r'(\d+(?:\.\d+)?)\s*(?:kg|kilos|kilograms|tons)?', text)
    qty = qty_match.group(1) if qty_match else "100"  # default realistically to 100
    
    # Identify Vegetable
    final_veg = "Tomato" # base default
    veg_found = False
    for v in sorted(_state.get("VEGETABLES", []), key=len, reverse=True):
        if v.lower() in text or (v.lower() + "s") in text: 
            final_veg = v
            veg_found = True
            break
            
    if not veg_found:
        # Check synonyms
        veg_synonyms = {"potato": "potato", "onions": "onion", "tomatoes": "tomato", "chilli": "capsicum"}
        for k, v in veg_synonyms.items():
            if k in text:
                final_veg = v
                veg_found = True
                break

    # Identify District
    final_dist = context_district.capitalize() if context_district else "Guntur"
    for d in _state.get("DISTRICTS", []):
        if d.lower() in text:
            final_dist = d
            break

    # --- 3. Process Intent ---
    if intent == "add_crop":
        return {
            "intent": "add_crop",
            "data": {"vegetable": final_veg, "quantity": qty, "district": final_dist},
            "speech": f"Great! I've prepared a listing for {qty} kilograms of {final_veg}."
        }
        
    elif intent == "get_price":
        try:
            prices_df = _state.get("prices_df")
            if prices_df is not None:
                v_mask = prices_df['vegetable'].str.lower() == final_veg.lower()
                d_mask = prices_df['district'].str.lower() == final_dist.lower()
                veg_data = prices_df[v_mask & d_mask]
                
                if not veg_data.empty:
                    price = int(veg_data.iloc[0]['avg_price'])
                    return {
                        "intent": "get_price",
                        "data": {"vegetable": final_veg, "district": final_dist, "price": price},
                        "speech": f"The current price for {final_veg} in {final_dist} is about {price} rupees per kg. Would you like to sell some?"
                    }
        except: pass
        return {
            "intent": "get_price",
            "speech": f"I couldn't find a price for {final_veg} in {final_dist} right now."
        }
        
    elif intent == "navigate":
        nav_pattern = r'(?:go to|navigation|open|show|visit)\s+(\w+)'
        nav_match = re.search(nav_pattern, text)
        page = nav_match.group(1).lower() if nav_match else "dashboard"
        mapping = {"home": "/", "dashboard": "/farmer/details", "details": "/farmer/details", "settings": "/settings", "profile": "/settings", "market": "/home", "login": "/"}
        target = mapping.get(page, "/farmer/details")
        return {
            "intent": "navigate",
            "data": {"path": target},
            "speech": f"Sure, opening {page}."
        }

    
    # If unknown but they said a vegetable and number, assume adding a crop as it's the farmer portal
    if veg_found and bool(re.search(r'\d', text)):
        return {
            "intent": "add_crop",
            "data": {"vegetable": final_veg, "quantity": qty, "district": final_dist},
            "speech": f"I heard {qty} of {final_veg}. I am preparing your crop listing."
        }

    # --- FALLBACK TO CHATBOT ---
    from pydantic import BaseModel
    class TempReq(BaseModel):
        message: str
        role: str = "farmer"
    chat_response = api_chat(TempReq(message=text, role="farmer"))
    
    return {
        "intent": "unknown",
        "speech": chat_response.get("response", "I heard you, but I am not certain how to assist. Please try again.")
    }

@router.post("/voice-command")
def api_voice_command(req: VoiceRequest):
    text_to_parse = req.text
    
    # 1. Translate input to English if needed
    if req.lang and not req.lang.startswith("en"):
        try:
            from deep_translator import GoogleTranslator
            src_lang = req.lang.split("-")[0]
            translated = GoogleTranslator(source=src_lang, target='en').translate(req.text)
            if translated:
                text_to_parse = translated
                print(f"Translated input: {req.text} -> {text_to_parse}")
        except Exception as e:
            print(f"Voice Input Translation Error: {e}")

    # 2. Parse using English rules
    result = parse_voice_command(text_to_parse, req.context_district)
    
    # 3. Translate response back to user's native language if needed
    if req.lang and not req.lang.startswith("en") and result.get("speech"):
        try:
            from deep_translator import GoogleTranslator
            target_lang = req.lang.split("-")[0]
            translated_speech = GoogleTranslator(source='en', target=target_lang).translate(result["speech"])
            if translated_speech:
                result["speech"] = translated_speech
        except Exception as e:
            print(f"Voice Output Translation Error: {e}")

    return {"success": True, **result}


# ── Chatbot Endpoint (FAQ / Rule-Based) ──────────────────────────────────────

class ChatRequest(BaseModel):
    message: str
    role: str = "consumer"
    lang: str = "en"

@router.post("/chat")
def api_chat(req: ChatRequest):
    # If the user speaks Telugu, translate it to English for processing
    text_to_process = req.message
    if req.lang and not req.lang.startswith("en"):
        try:
            from deep_translator import GoogleTranslator
            target_src = req.lang.split("-")[0]
            translated = GoogleTranslator(source=target_src, target='en').translate(req.message)
            if translated:
                text_to_process = translated
        except Exception as e:
            print(f"Chat Input Translation Error: {e}")

    msg = text_to_process.lower().strip()
    clean_msg = re.sub(r'[^\w\s]', '', msg)
    words = set(clean_msg.split())
    
    # Helpers
    def extract_entity(entity_list):
        for e in entity_list:
            if e.lower() in clean_msg:
                return e
        return None

    response = ""

    # 1. Dynamic Stats Engine
    if bool(words.intersection({"many", "total", "count", "stats"})) and bool(words.intersection({"farmers", "users", "crops"})):
        total_csv_farmers = sum(len(v) for v in _state.get("csv_cache", {}).values())
        response = f"Currently, we have over {total_csv_farmers} farmers actively listed in our database alongside live market sources from {_state.get('districts_df').shape[0]} districts!"
        
    # 2. Dynamic Price Engine
    elif ("price" in words or "cost" in words) and ("of" in words or "for" in words):
        veg = extract_entity(_state.get("VEGETABLES", []))
        dist = extract_entity(_state.get("DISTRICTS", [])) or "Guntur"
        if veg:
            prices_df = _state.get("prices_df")
            if prices_df is not None:
                v_mask = prices_df['vegetable'].str.lower() == veg.lower()
                d_mask = prices_df['district'].str.lower() == dist.lower()
                veg_data = prices_df[v_mask & d_mask]
                if not veg_data.empty:
                    p = int(veg_data.iloc[0]['avg_price'])
                    response = f"The live market average for {veg} in {dist} is around ₹{p}/kg. Keep an eye on our interactive map for real-time farmer listings which are usually cheaper!"
            if not response:
                try:
                    p = _state["predict_price"](_state.get("model"), _state.get("encoders"), veg, dist, 6, 2025, 20, 2000)
                    response = f"I predict {veg} in {dist} will cost about ₹{round(p, 2)}/kg based on current AI forecasts."
                except:
                    pass
        if not response:
            response = "I can tell you the price! Just specify the vegetable name and district (e.g., 'What is the price of Tomato in Guntur?')"

    # 3. Comprehensive FAQ & General
    elif bool(words.intersection({"about", "details", "explain", "what"})) and bool(words.intersection({"app", "project", "farm2u", "this"})):
        response = "FARM2U is an advanced AI-powered marketplace. We connect farmers directly with consumers, completely eliminating middlemen. Farmers enjoy Voice-guided multi-lingual logins, while consumers get transparent ML price predictions and interactive mapping for their daily groceries."
    
    elif bool(words.intersection({"hello", "hi", "hey", "namaste"})):
        name = "Farmer" if req.role == "farmer" else "Shopper"
        response = f"Hello there, {name}! I am the AI Assistant. You can ask me about live crop prices, how many farmers are active, or how to use any feature."
        
    elif bool(words.intersection({"list", "sell", "add"})) or "add crop" in msg:
        if req.role == "farmer":
            response = "To list your crops, go to your Farmer Dashboard. Select your district and crop, enter the quantity, and click 'List Crop'. You can also use the Voice Assistant!"
        else:
            response = "Only farmers can list crops. Please log in through the Farmer Portal to sell your produce."
            
    elif bool(words.intersection({"buy", "search", "find"})):
        response = "You can find fresh crops on the interactive map on your Home Page. Filter by district or vegetable, view stock, and buy directly for Home Delivery or Self-Pickup!"
        
    elif bool(words.intersection({"voice", "speak", "mic", "iliterate", "type"})):
        response = "If you or someone cannot type, simply go to the Farmer Portal and click the glowing Microphone. Our completely hands-free AI will ask for your mobile number and password out-loud, letting you login with just your voice!"
        
    elif bool(words.intersection({"password", "login", "reset"})):
        response = "For login issues, ensure you are using the correct portal. Farmers can now use the new Voice Login! Consumers can login with default credentials or sign up."
        
    elif bool(words.intersection({"theme", "dark", "light", "color"})):
        response = "We just launched our new Theme engine! You can switch between Dark Mode and Light Mode at the top of the Home Page."
        
    elif bool(words.intersection({"problem", "issue", "help"})):
        response = "I'm here to solve it! You can ask me 'What is the price of Tomato', 'How many farmers are there', or 'Tell me about the app'."
        
    elif bool(words.intersection({"who", "developer", "creator", "made"})):
        response = "FARM2U was developed by a specialized team: Devi Prasanth Badireddy, Jeeshan Agastya, Farhat Yasmin, Manoj Reddy Baki, and Dinesh Chitturu."
        
    else:
        # Fallback dynamic logic
        response = "I can answer questions about the app, real-time vegetable prices (e.g. 'price of onion'), farmer statistics, or how to use the Voice Login. Try asking one of these!"

    # Translate back to native language if needed
    if req.lang and not req.lang.startswith("en") and response:
        try:
            from deep_translator import GoogleTranslator
            target_lang = req.lang.split("-")[0]
            translated_response = GoogleTranslator(source='en', target=target_lang).translate(response)
            if translated_response:
                response = translated_response
        except Exception as e:
            print(f"Chat Output Translation Error: {e}")

    return {"success": True, "response": response}


@router.get("/model-info")
def get_model_info():
    from ml_model.train import INFO_PATH  # pyre-ignore[21]
    if os.path.exists(INFO_PATH):
        with open(INFO_PATH, "r") as f:
            return {"success": True, "info": json.load(f)}
    return {"success": False, "message": "No model info available"}


@router.get("/predict-price")
def predict_price_api(
    vegetable: str = Query(...),
    district: str = Query(...),
    month: int = Query(6),
    year: int = Query(2025),
):
    model = _state.get("model")
    encoders = _state.get("encoders")
    if model is None:
        return {"success": False, "message": "Model not trained yet. POST /api/train-model first."}

    # Get avg production stats for this vegetable/district
    vegs_df = _state["vegs_df"]
    mask = (
        (vegs_df["vegetable"].str.lower() == vegetable.lower()) &
        (vegs_df["district"].str.lower() == district.lower())
    )
    row = vegs_df[mask]
    avg_yield = float(row["avg_yield"].iloc[0]) if not row.empty else 20.0
    avg_area = float(row["avg_area"].iloc[0]) if not row.empty else 2000.0

    price = _state["predict_price"](
        model, encoders, vegetable, district, month, year, avg_yield, avg_area
    )
    return {"success": True, "predicted_price": price, "vegetable": vegetable, "district": district}


@router.get("/recommendations")
def get_recommendations(district: str = Query("Guntur")):
    recs = _state["get_recommendations"](district, top_n=8)

    model = _state.get("model")
    encoders = _state.get("encoders")
    import datetime
    current_month = datetime.datetime.now().month
    current_year = datetime.datetime.now().year

    result = []
    for r in recs:
        predicted_price = r.get("avg_price", 0)
        if model and encoders:
            try:
                predicted_price = _state["predict_price"](
                    model, encoders,
                    r["vegetable"], r["district"],
                    current_month, current_year,
                    r.get("avg_yield", 20), r.get("avg_area", 2000)
                )
            except Exception:
                pass
        result.append({
            "vegetable": r.get("vegetable", ""),
            "district": r.get("district", ""),
            "lat": r.get("lat", 0),
            "lon": r.get("lon", 0),
            "avg_price": round(r.get("avg_price", 0), 2),
            "predicted_price": round(predicted_price, 2),
        })
    return {"success": True, "recommendations": result}


@router.get("/districts")
def get_districts():
    districts_df = _state["districts_df"]
    rows = districts_df[["district", "latitude", "longitude", "region"]].to_dict("records")
    return {"success": True, "districts": rows}


@router.get("/vegetables-list")
def list_vegetables():
    return {"success": True, "vegetables": _state.get("VEGETABLES", [])}


@router.post("/train-model")
def trigger_training():
    from ml_model.train import train_model  # pyre-ignore[21]
    prices_df = _state["prices_df"]
    production_df = _state["production_df"]
    model, encoders, mae = train_model(prices_df, production_df)
    _state["model"] = model
    _state["encoders"] = encoders
    return {"success": True, "message": f"Model trained. MAE = ₹{mae:.2f}/kg"}
