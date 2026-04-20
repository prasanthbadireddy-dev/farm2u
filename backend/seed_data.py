import pandas as pd
import random
import os

def seed_farmers():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    farmers_path = os.path.join(base_dir, "data", "farmers.csv")
    districts_path = os.path.join(base_dir, "data", "districts_dataset.csv")
    
    if not os.path.exists(farmers_path):
        print("farmers.csv not found!")
        return

    # Load data
    farmers_df = pd.read_csv(farmers_path)
    districts_df = pd.read_csv(districts_path)
    
    # Valid options
    vegetables = ['Tomato', 'Okra', 'Cauliflower', 'Potato', 'Bottle Gourd', 'Green Chilli', 'Cabbage', 'Spinach', 'Onion', 'Brinjal']
    districts = districts_df[['district_id', 'district']].to_dict('records') # ID and Name
    
    print(f"Randomizing {len(farmers_df)} farmers...")
    
    for idx, row in farmers_df.iterrows():
        # Random vegetable
        farmers_df.at[idx, 'vegetables_grown'] = random.choice(vegetables)
        
        # Random district
        d = random.choice(districts)
        farmers_df.at[idx, 'district_id'] = d['district_id']
        # Note: farmers_df merge in data_loader handles the name, lat, lon.
        
        # Random initial price and quantity (per user request to 'store it')
        farmers_df.at[idx, 'price'] = round(random.uniform(15, 65), 2)
        farmers_df.at[idx, 'quantity'] = random.randint(20, 1000)

    # Save back
    farmers_df.to_csv(farmers_path, index=False)
    print(f"Successfully updated {farmers_path} with random assignments and prices.")

if __name__ == "__main__":
    seed_farmers()
