import re

with open('/home/aryagami/smpp_service/static/js/app.js', 'r') as f:
    text = f.read()

start_marker = "  // =========================\n  // VIEW SENDERS MODAL LOGIC"
end_marker = "  // =========================\n  // SENDER MODAL LOGIC"

if start_marker in text and end_marker in text:
    start_idx = text.find(start_marker)
    end_idx = text.find(end_marker)
    
    extracted = text[start_idx:end_idx]
    
    new_text = text[:start_idx] + text[end_idx:]
    new_text = new_text + "\n" + extracted
    
    with open('/home/aryagami/smpp_service/static/js/app.js', 'w') as f:
        f.write(new_text)
    
    print("Success")
else:
    print("Failed to find markers")
