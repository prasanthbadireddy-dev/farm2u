import sys

# 1. Fix Landing Page Light Mode Names
with open("frontend/src/pages/LandingPage.tsx", "r", encoding="utf-8") as f:
    lp = f.read()
lp = lp.replace('className="flex items-center gap-2 mx-10 text-xs font-semibold text-slate-300 flex-shrink-0"', 'className="flex items-center gap-2 mx-10 text-xs font-semibold text-[color:var(--text-main)] flex-shrink-0"')
with open("frontend/src/pages/LandingPage.tsx", "w", encoding="utf-8") as f:
    f.write(lp)


# 2. Fix VoiceLoginAssistant silent fail bug
with open("frontend/src/components/VoiceLoginAssistant.tsx", "r", encoding="utf-8") as f:
    vla = f.read()

vla_fix = """
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
    
    let handled = false;
    utterance.onend = () => {
      if (!handled && onEnd) {
        handled = true;
        onEnd();
      }
    };
    utterance.onerror = () => {
      if (!handled && onEnd) {
        handled = true;
        onEnd();
      }
    };
    window.speechSynthesis.speak(utterance);
    
    // Fallback if OS Speech Synthesis silently fails (common error)
    setTimeout(() => {
      if (!handled && onEnd) {
        handled = true;
        onEnd();
      }
    }, 4000);
"""
# Replace the original speak function body
vla = vla.replace("""
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    // Use an English or Telugu voice based on context if available
    utterance.lang = language === 'te' ? 'te-IN' : 'en-IN';
    utterance.onend = () => {
      if (onEnd) onEnd();
    };
    window.speechSynthesis.speak(utterance);
""", "\n    window.speechSynthesis.cancel();" + vla_fix)

with open("frontend/src/components/VoiceLoginAssistant.tsx", "w", encoding="utf-8") as f:
    f.write(vla)

# 3. Integrate Chatbot Fallback for Voice Assistant so it acts as an intelligent assistant
with open("backend/routes/data_routes.py", "r", encoding="utf-8") as f:
    routes = f.read()

# Instead of 'unknown' intent returning "I heard you...", process it in Chatbot!
fallback_logic = """
    # If unknown but they said a vegetable and number, assume adding a crop as it's the farmer portal
    if veg_found and bool(re.search(r'\\d', text)):
        return {
            "intent": "add_crop",
            "data": {"vegetable": final_veg, "quantity": qty, "district": final_dist},
            "speech": f"I heard {qty} of {final_veg}. I am preparing your crop listing."
        }

    # --- FALLBACK TO CHATBOT ---
    from pydantic import BaseModel
    class TempReq(BaseModel):
        message: str
        role: str = "farmer"
    chat_response = api_chat(TempReq(message=text, role="farmer"))
    
    return {
        "intent": "unknown",
        "speech": chat_response.get("response", "I heard you, but I am not certain how to assist. Please try again.")
    }
"""

# Replace the existing bottom of parse_voice_command
routes_updated = routes.split("# If unknown but they said a vegetable and number, assume adding a crop as it's the farmer portal")[0] + fallback_logic

# Find where @router.post("/voice-command") starts
# Need to make sure the replacement didn't drop the rest of the file
rest_of_file = routes.split("def api_voice_command(req: VoiceRequest):")[1]
routes_final = routes_updated + '\n@router.post("/voice-command")\ndef api_voice_command(req: VoiceRequest):' + rest_of_file

with open("backend/routes/data_routes.py", "w", encoding="utf-8") as f:
    f.write(routes_final)

print("Patch applied")
