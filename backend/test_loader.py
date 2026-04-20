import sys
sys.path.append('.')
from data_loader import get_farmers_by_vegetable, farmers_df

print("Farmers df empty?", farmers_df.empty)
print("Rows in farmers_df:", len(farmers_df))
farmers = get_farmers_by_vegetable()
print("Farmers loaded by FN:", len(farmers))
if len(farmers) > 0:
    print("Sample:", farmers[0])
