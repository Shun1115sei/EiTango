import glob
import re

def add_firebase_refs():
    html_files = glob.glob("*.html")
    
    firebase_scripts = '''    <!-- Firebase SDK -->
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-app.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-auth.js"></script>
    <script src="https://www.gstatic.com/firebasejs/8.10.1/firebase-firestore.js"></script>
    <script src="assets/js/firebase-config.js"></script>
    <script src="assets/js/firebase-manager.js"></script>
'''

    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "firebase-app.js" in content:
            print(f"Skipping {file_path}, already has Firebase.")
            continue
            
        # Insert before <script src="assets/js/app.js"></script>
        # Or before any app.js reference
        
        if "assets/js/app.js" in content:
            new_content = content.replace('<script src="assets/js/app.js"></script>', firebase_scripts + '    <script src="assets/js/app.js"></script>')
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"Could not find app.js script tag in {file_path}")

if __name__ == "__main__":
    add_firebase_refs()
