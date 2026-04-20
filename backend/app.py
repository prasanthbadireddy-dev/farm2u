"""
app.py — FastAPI main application entry point.
Run with: uvicorn app:app --reload --port 8000
"""
import os
import random
import threading
from contextlib import asynccontextmanager
from fastapi import FastAPI  # pyre-ignore[21]
from fastapi.middleware.cors import CORSMiddleware  # pyre-ignore[21]

from data_loader import (  # pyre-ignore[21]
    prices_df, production_df, vegs_df, districts_df,
    get_vegetable_locations, get_recommendations, get_all_veg_locations,
    get_farmers_by_vegetable,
    DISTRICTS, VEGETABLES,
)
from ml_model.train import load_model, train_model, predict_price  # pyre-ignore[21]
from routes.auth_routes import router as auth_router  # pyre-ignore[21]
from routes.farmer_routes import router as farmer_router  # pyre-ignore[21]
from routes.data_routes import router as data_router, set_state  # pyre-ignore[21]


# ── CSV Farmer Cache (refreshed every 60 seconds) ───────────────────────────
_csv_cache: dict = {}  # key: (vegetable_lower, district_lower) → enriched farmer list
_csv_cache_lock = threading.Lock()

def _build_csv_cache(get_farmers_by_vegetable_fn, prices_df_ref, VEGETABLES_ref, DISTRICTS_ref):
    """Regenerate random price & quantity for all CSV farmers."""
    new_cache = {}
    try:
        for veg in VEGETABLES_ref:
            raw = get_farmers_by_vegetable_fn(vegetable=veg, district="")
            for f in raw:
                base_price = None
                try:
                    if prices_df_ref is not None:
                        vm = prices_df_ref['vegetable'].str.lower() == f['vegetable'].lower()
                        dm = prices_df_ref['district'].str.lower() == f['district'].lower()
                        veg_data = prices_df_ref[vm & dm]
                        if not veg_data.empty:
                            base_price = float(veg_data.iloc[0]['avg_price'])
                except Exception:
                    pass
                f["quantity"] = random.randint(50, 500)
                if base_price:
                    f["price"] = round(base_price * random.uniform(0.70, 0.95), 2)
                else:
                    f["price"] = round(random.uniform(10, 60), 2)
                f["avg_price"] = f["price"]
                key = (f.get("vegetable", "").lower(), f.get("district", "").lower())
                f["crop_id"] = f"csv-{f.get('district','')}-{f.get('vegetable','')}".replace(" ", "-").lower()
                new_cache.setdefault(key, []).append(f)
    except Exception as e:
        print(f"[CSV Cache] Error rebuilding: {e}")
        return
    with _csv_cache_lock:
        _csv_cache.clear()
        _csv_cache.update(new_cache)
    print(f"[CSV Cache] Refreshed — {sum(len(v) for v in _csv_cache.values())} CSV farmer entries.")

def _start_csv_refresh_loop(get_farmers_by_vegetable_fn, prices_df_ref, VEGETABLES_ref, DISTRICTS_ref):
    """Background thread: refreshes CSV cache every 60 seconds."""
    def loop():
        while True:
            _build_csv_cache(get_farmers_by_vegetable_fn, prices_df_ref, VEGETABLES_ref, DISTRICTS_ref)
            threading.Event().wait(60)  # wait 60 seconds
    t = threading.Thread(target=loop, daemon=True)
    t.start()
    print("[CSV Cache] Background refresh thread started (every 60s).")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Auto-train model if missing ──────────────────────────────────────
    print("[Startup] Loading data and ML model...")
    model, encoders = load_model()
    if model is None:
        print("[Startup] No saved model found — training now (this may take a moment)...")
        model, encoders, mae = train_model(prices_df, production_df)
        print(f"[Startup] Training done. MAE = ₹{mae:.2f}/kg")
    else:
        print("[Startup] Loaded existing model from disk.")

    # Inject state into data_routes
    set_state(
        prices_df=prices_df,
        production_df=production_df,
        vegs_df=vegs_df,
        model=model,
        encoders=encoders,
        get_veg_locations_fn=get_vegetable_locations,
        get_recommendations_fn=get_recommendations,
        predict_price_fn=predict_price,
        get_all_veg_locations_fn=get_all_veg_locations,
        get_farmers_by_vegetable_fn=get_farmers_by_vegetable,
        districts_df=districts_df,
        DISTRICTS=DISTRICTS,
        VEGETABLES=VEGETABLES,
        csv_cache=_csv_cache,
        csv_cache_lock=_csv_cache_lock,
    )

    # Start CSV cache refresh background thread
    _start_csv_refresh_loop(get_farmers_by_vegetable, prices_df, VEGETABLES, DISTRICTS)

    print("[Startup] System ready.")
    yield
    print("[Shutdown] Goodbye.")


app = FastAPI(
    title="Smart Vegetable Availability & Price Transparency API",
    version="1.0.0",
    lifespan=lifespan,
)

allowed_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=".*",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router)
app.include_router(farmer_router)
app.include_router(data_router)


@app.get("/")
def root():
    return {
        "message": "Smart Vegetable Availability & Price Transparency API",
        "docs": "/docs",
        "status": "running",
    }


@app.get("/health")
def health():
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn  # pyre-ignore[21]
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)
