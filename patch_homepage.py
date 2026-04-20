import re
with open("frontend/src/pages/HomePage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add theme toggle to HomePage import
if "import { useTheme } from '../context/ThemeContext';" not in content:
    content = content.replace("import { useState, useEffect, useCallback } from 'react';", "import { useState, useEffect, useCallback } from 'react';\nimport { useTheme } from '../context/ThemeContext';\nimport { Sun, Moon } from 'lucide-react';")

# Add theme toggle button near the top of the HomePage
if "const { theme, toggleTheme } = useTheme();" not in content:
    content = content.replace("export default function HomePage() {", "export default function HomePage() {\n  const { theme, toggleTheme } = useTheme();")

theme_btn = """
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-3xl font-black gradient-text">AgriMarket Explorer</h1>
        <button onClick={toggleTheme} className="p-3 rounded-xl glass hover:bg-green-500/10 transition-colors flex items-center gap-2">
          {theme === 'dark' ? <Moon className="w-5 h-5 text-blue-400" /> : <Sun className="w-5 h-5 text-yellow-500" />}
          <span className="font-bold hidden sm:inline">{theme === 'dark' ? 'Dark' : 'Light'} Mode</span>
        </button>
      </div>
"""

# Insert theme toggle below root div
if "AgriMarket Explorer" not in content:
    content = content.replace('<div className="space-y-8 pb-12 animate-fade-in">', '<div className="space-y-8 pb-12 animate-fade-in">\n' + theme_btn)

# Replace hardcoded dark colors
content = content.replace("'rgba(10,15,30,0.8)'", "'var(--card-bg)'")
content = content.replace("'rgba(10,15,30,0.6)'", "'var(--glass-bg)'")
content = content.replace("'rgba(15,23,42,0.6)'", "'var(--glass-bg)'")
content = content.replace("'rgba(8,12,24,0.98)'", "'var(--nav-bg)'")
content = content.replace("'rgba(15,23,42,0.8)'", "'var(--card-bg)'")
content = content.replace("'#0a0f1e'", "'var(--input-bg)'")
content = content.replace("color: 'white'", "color: 'var(--text-main)'")
content = content.replace("color: '#e2e8f0'", "color: 'var(--text-main)'")
content = content.replace("text-white", "text-[var(--text-main)]")

# Fix Search Results hover backgrounds which are hardcoded
content = content.replace("el.style.background = 'rgba(15,23,42,0.6)'", "el.style.background = 'var(--glass-bg)'")

with open("frontend/src/pages/HomePage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
