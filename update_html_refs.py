import glob
import os
import re

def update_html_refs():
    html_files = glob.glob("*.html")
    
    for file_path in html_files:
        if "index.html" in file_path:
            continue
            
        json_filename = os.path.splitext(os.path.basename(file_path))[0] + ".json"
        json_path = f"assets/data/{json_filename}"
        
        # Check if corresponding JSON exists
        if not os.path.exists(json_path):
            print(f"Skipping {file_path}, JSON not found at {json_path}")
            continue

        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Regex to find the whole script block that defines vocabulary
        # We assume the script block contains "const vocabulary = ["
        regex = r'<script>.*?const vocabulary = \[.*?</script>'
        
        replacement = f'''<script>
        // Load data from JSON
        const app = new FlashcardApp('{json_path}');
    </script>'''
        
        # Use DOTALL so . matches newlines
        new_content = re.sub(regex, replacement, content, flags=re.DOTALL)
        
        if new_content != content:
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"No match found in {file_path} (already updated?)")

if __name__ == "__main__":
    update_html_refs()
