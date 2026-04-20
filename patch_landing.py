import re

with open("frontend/src/index.css", "r", encoding="utf-8") as f:
    css = f.read()
css = css.replace("animation: fall inline 10s linear infinite;", "animation: fall 10s linear infinite; opacity: 0;")
with open("frontend/src/index.css", "w", encoding="utf-8") as f:
    f.write(css)

with open("frontend/src/pages/LandingPage.tsx", "r", encoding="utf-8") as f:
    content = f.read()

# Add imports for Theme
if "useTheme" not in content:
    content = content.replace(
        "import { Link } from 'react-router-dom';",
        "import { Link } from 'react-router-dom';\nimport { useTheme } from '../context/ThemeContext';\nimport { Sun, Moon } from 'lucide-react';"
    )

if "const { theme, toggleTheme } = useTheme();" not in content:
    content = content.replace("export default function LandingPage() {", "export default function LandingPage() {\n  const { theme, toggleTheme } = useTheme();")

# Inject Toggle Button at Top Right
toggle_btn = """
      <div className="absolute top-6 right-6 z-50">
        <button onClick={toggleTheme} className="p-3 rounded-full hover:bg-green-500/10 transition-colors flex items-center justify-center border border-green-500/30" style={{ background: 'var(--glass-bg)', boxShadow: '0 4px 15px rgba(0,0,0,0.1)' }}>
          {theme === 'dark' ? <Moon className="w-6 h-6 text-blue-400" /> : <Sun className="w-6 h-6 text-yellow-500" />}
        </button>
      </div>
"""
if "absolute top-6 right-6" not in content:
    content = content.replace('<div className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 py-8">', '<div className="relative min-h-[92vh] flex flex-col items-center justify-center overflow-hidden px-4 py-8">\n' + toggle_btn)

# Add some swaying tree leaves / agriculture animations to the background
leaf_animations = """
      {/* ── Falling Leaves Animation ─── */}
      <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden">
        {['🍃', '🌿', '🌱', '🍂', '🍃'].map((leaf, i) => (
          <div key={`leaf-${i}`} className="absolute text-3xl animate-fall" style={{ 
              left: `${15 + i * 18}%`, 
              animationDuration: `${8 + i * 2}s`,
              animationDelay: `${i * 1.5}s`,
              filter: `drop-shadow(0 4px 8px rgba(34,197,94,0.4))` 
            }}>
            {leaf}
          </div>
        ))}
      </div>
"""
content = content.replace("{/* ── Floating vegetable emojis ─────────────── */}", leaf_animations + "\n      {/* ── Floating vegetable emojis ─────────────── */}")

# Remove hardcoded stylings for theme
content = content.replace("rgba(15,23,42,0.7)", "var(--glass-bg)")
content = content.replace("rgba(10,15,30,0.5)", "var(--card-bg)")
content = content.replace("color: '#e2e8f0'", "color: 'var(--text-main)'")
content = content.replace("text-white", "text-[var(--text-main)]")

with open("frontend/src/pages/LandingPage.tsx", "w", encoding="utf-8") as f:
    f.write(content)
