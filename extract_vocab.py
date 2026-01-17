import re
import json
import glob
import os

def extract_vocab():
    html_files = glob.glob("*.html")
    regex = r"const vocabulary = (\[.*?\]);"
    
    print(f"Found {len(html_files)} HTML files.")

    for file_path in html_files:
        if "index.html" in file_path:
            continue
            
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        match = re.search(regex, content, re.DOTALL)
        if match:
            json_str = match.group(1)
            
            # Remove JS comments // ...
            json_str = re.sub(r'//.*', '', json_str)
            # Remove JS comments /* ... */
            json_str = re.sub(r'/\*.*?\*/', '', json_str, flags=re.DOTALL)
            
            try:
                # Try strict JSON parse first
                data = json.loads(json_str)
            except json.JSONDecodeError:
                # Fallback: Relaxed parsing (using ast.literal_eval is risky if not careful, but for this limited scope it's ok-ish, 
                # or better, just use a regex to quote keys if missing)
                print(f"Standard JSON parse failed for {file_path}. Trying to fix keys...")
                # Simple fix for unquoted keys: { word: -> { "word":
                json_str_fixed = re.sub(r'([{,])\s*([a-zA-Z0-9_]+):', r'\1 "\2":', json_str)
                try:
                    data = json.loads(json_str_fixed)
                except:
                    print(f"Failed to parse {file_path}")
                    continue

            # normalize keys to lowercase
            normalized_data = []
            for item in data:
                new_item = {}
                for k, v in item.items():
                    new_item[k.lower()] = v
                normalized_data.append(new_item)

            output_name = os.path.splitext(file_path)[0] + ".json"
            output_path = os.path.join("assets/data", output_name)
            
            with open(output_path, "w", encoding="utf-8") as f:
                json.dump(normalized_data, f, ensure_ascii=False, indent=4)
            
            print(f"Extracted {output_name}")
        else:
            print(f"No vocabulary found in {file_path}")

if __name__ == "__main__":
    extract_vocab()
