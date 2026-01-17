# Vocabulary Flashcard Generator Prompt

Use this prompt to generate new vocabulary flashcard pages for the VocabAtlas project.

---

## Instructions for AI

You are an expert web developer tasked with creating a new flashcard HTML file for the VocabAtlas project.
The project uses specific shared assets for styling and logic. DO NOT write inline CSS or complex JavaScript logic.

### 1. File Structure
Create a single HTML file (e.g., `5000_10.html`) with the following structure:

```html
<!DOCTYPE html>
<html lang="ja">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>[Insert Deck Title Here]</title>
    <!-- Shared Styles -->
    <link rel="stylesheet" href="assets/css/style.css">
</head>
<body>

    <header>
        <h1>[Insert Deck Title Here]</h1>
        <div class="status-bar">
            残り: <strong id="remaining-count">0</strong> 枚
        </div>
    </header>
    
    <div class="card-container">
        <!-- Completion Overlay -->
        <div class="completed-overlay" id="completed-overlay">
            <div class="completed-title">🎉</div>
            <p class="completed-text">ALL WORDS LEARNED!</p>
            <button class="btn-restart" onclick="app.resetAll()">Start Over</button>
        </div>

        <!-- Flashcard Component -->
        <div class="card" id="flashcard">
            <div class="card-face card-front">
                <div class="word" id="word">Word</div>
                <div class="phonetic" id="phonetic">/phonetic/</div>
                <!-- Audio Button -->
                <button class="btn-audio" onclick="app.playAudio(event)" title="Pronounce">🔊</button>
                <div class="click-hint">Click to Flip</div>
            </div>
            <div class="card-face card-back">
                <div class="translation" id="translation">Translation</div>
                <div class="meaning" id="meaning">Meaning</div>
            </div>
        </div>
    </div>

    <!-- Controls -->
    <div class="controls-container">
        <div class="grading-group">
            <button class="btn-grade btn-unknown" onclick="app.markUnknown(event)">
                🔄 Review
                <span>(Keep in list)</span>
            </button>
            <button class="btn-grade btn-known" onclick="app.markKnown(event)">
                ✅ Got it
                <span>(Remove)</span>
            </button>
        </div>

        <div class="nav-group">
            <button class="nav-btn" onclick="app.prevCard(event)">← Prev</button>
            <button class="nav-btn" onclick="app.shuffleCards(event)">🔀 Shuffle</button>
            <button class="nav-btn" onclick="app.resetAll()">↻ Reset</button>
        </div>
        
        <div style="text-align:center; margin-top:20px;">
            <a href="index.html" class="nav-btn" style="text-decoration:none;">🏠 Home</a>
        </div>
    </div>

    <!-- Shared Scripts -->
    <script src="assets/js/confetti.js"></script>
    <script src="assets/js/app.js"></script>
    
    <!-- Data & Initialization -->
    <script>
        // Replace this array with the specific vocabulary for this deck
        const vocabulary = [
            { 
                "word": "example", 
                "phonetic": "[igzǽmpl]", 
                "translation": "例", 
                "meaning": "説明のために挙げる具体的な事柄。<br>HTMLタグも使用可能です。" 
            },
            // ... more words ...
        ];

        // Initialize App
        const app = new FlashcardApp(vocabulary);
    </script>
</body>
</html>
```

### 2. Requirements
*   **CSS**: utilize `assets/css/style.css`. Do not add `<style>` tags.
*   **JS**: utilize `assets/js/app.js` (logic) and `assets/js/confetti.js` (effects).
*   **Data Format**:
    *   `word`: The English word.
    *   `phonetic`: Pronunciation (e.g., `[tést]`).
    *   `translation`: Short Japanese translation.
    *   `meaning`: Detailed explanation (can include `<br>` tags).
*   **Responsiveness**: The structure is already optimized for mobile via `style.css`.
*   **New Features Included**:
    *   **Auto-generated Word List**: The `app.js` automatically adds a "List" button.
    *   **Celebration**: Confetti triggers automatically on completion.
    *   **Audio**: Built-in TTS connected via `app.playAudio(event)`.

### 3. Usage
Provide the vocabulary list in JSON or CSV format, and I will generate the complete HTML file for you.