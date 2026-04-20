import re
with open("frontend/src/pages/FarmerDetails.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded dark colors
content = content.replace("'rgba(10,15,30,0.85)'", "'var(--card-bg)'")
content = content.replace("'rgba(10,15,30,0.6)'", "'var(--glass-bg)'")
content = content.replace("'rgba(10,15,30,0.8)'", "'var(--card-bg)'")
content = content.replace("'rgba(15,23,42,0.6)'", "'var(--glass-bg)'")
content = content.replace("'rgba(15,23,42,0.8)'", "'var(--card-bg)'")
content = content.replace("'rgba(10,15,30,0.9)'", "'var(--card-bg)'")
content = content.replace("'rgba(8,12,24,0.98)'", "'var(--nav-bg)'")
content = content.replace("'#0a0f1e'", "'var(--input-bg)'")
content = content.replace("color: 'white'", "color: 'var(--text-main)'")
content = content.replace("color: '#e2e8f0'", "color: 'var(--text-main)'")
content = content.replace("text-white", "text-[var(--text-main)]")

with open("frontend/src/pages/FarmerDetails.tsx", "w", encoding="utf-8") as f:
    f.write(content)
