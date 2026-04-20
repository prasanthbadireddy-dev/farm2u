import sys
sys.path.append('.')
from data_loader import prices_df, VEGETABLES, DISTRICTS, get_farmers_by_vegetable
from app import _build_csv_cache, _csv_cache
_build_csv_cache(get_farmers_by_vegetable, prices_df, VEGETABLES, DISTRICTS)
print(f"Cache size: {len(_csv_cache)}")
print(f"Total entries: {sum(len(v) for v in _csv_cache.values())}")
