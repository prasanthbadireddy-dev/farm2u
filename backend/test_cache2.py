import sys
sys.path.append('.')
from data_loader import prices_df, VEGETABLES, DISTRICTS, get_farmers_by_vegetable
from app import _build_csv_cache, _csv_cache
_build_csv_cache(get_farmers_by_vegetable, prices_df, VEGETABLES, DISTRICTS)
with open("test_cache2.txt", "w", encoding="utf-8") as f:
    f.write(f"Cache size: {len(_csv_cache)}\n")
    f.write(f"Total entries: {sum(len(v) for v in _csv_cache.values())}\n")
