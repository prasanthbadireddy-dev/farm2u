import sys
sys.path.append('.')
from data_loader import get_farmers_by_vegetable, farmers_df

with open("py_out.txt", "w", encoding="utf-8") as f:
    f.write(f"Farmers df empty? {farmers_df.empty}\n")
    f.write(f"Rows in farmers_df: {len(farmers_df)}\n")
    farmers = get_farmers_by_vegetable()
    f.write(f"Farmers loaded by FN: {len(farmers)}\n")
    if len(farmers) > 0:
        f.write(f"Sample: {farmers[0]}\n")
