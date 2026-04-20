import re
with open("frontend/src/components/Chatbot.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Replace hardcoded dark colors
content = content.replace("'rgba(10,15,30,0.95)'", "'var(--card-bg)'")
content = content.replace("bg-slate-900/80", "bg-[var(--nav-bg)]")
content = content.replace("bg-slate-900", "bg-[var(--nav-bg)]")
content = content.replace("bg-slate-800", "bg-[var(--input-bg)] text-[var(--text-main)]")
content = content.replace("text-white", "text-[var(--text-main)]")

with open("frontend/src/components/Chatbot.tsx", "w", encoding="utf-8") as f:
    f.write(content)
