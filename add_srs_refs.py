import glob

def add_srs_refs():
    html_files = glob.glob("*.html")
    
    srs_script = '    <script src="assets/js/srs.js"></script>'

    for file_path in html_files:
        with open(file_path, "r", encoding="utf-8") as f:
            content = f.read()
            
        if "assets/js/srs.js" in content:
            print(f"Skipping {file_path}, already has SRS.")
            continue
            
        # Insert before app.js
        if "assets/js/app.js" in content:
            new_content = content.replace('<script src="assets/js/app.js"></script>', srs_script + '\n    <script src="assets/js/app.js"></script>')
            
            with open(file_path, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"Updated {file_path}")
        else:
            print(f"Could not find app.js script tag in {file_path}")

if __name__ == "__main__":
    add_srs_refs()
