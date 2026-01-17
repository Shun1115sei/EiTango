
class FlashcardApp {
    constructor(dataOrUrl, options = {}) {
        this.deck = [];
        this.allCards = [];
        this.currentIndex = 0;
        this.isFlipped = false;

        // DOM Elements
        this.els = {
            card: document.getElementById('flashcard'),
            word: document.getElementById('word'),
            phonetic: document.getElementById('phonetic'),
            translation: document.getElementById('translation'),
            meaning: document.getElementById('meaning'),
            remaining: document.getElementById('remaining-count'),
            completedOverlay: document.getElementById('completed-overlay'),
            title: document.querySelector('h1'),
        };

        // Audio setup
        this.synth = window.speechSynthesis;
        this.voices = [];
        this.loadVoices();
        if (speechSynthesis.onvoiceschanged !== undefined) {
            speechSynthesis.onvoiceschanged = this.loadVoices.bind(this);
        }

        // Bind events
        this.bindEvents();
        this.setupWordListUI();

        // Initialize Data
        this.deckId = 'custom'; // Default

        if (typeof dataOrUrl === 'string') {
            // Extract filename as ID (e.g., "5000_15")
            const matches = dataOrUrl.match(/([^/]+)\.json$/);
            if (matches) this.deckId = matches[1];

            this.setupQuizUI();
            this.loadDeck(dataOrUrl);
        } else if (Array.isArray(dataOrUrl)) {
            this.allCards = dataOrUrl;
            this.deck = [...dataOrUrl];
            this.init();
        }
    }

    async loadDeck(url) {
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            this.allCards = data;

            // Sync with Cloud
            if (window.dbManager && window.dbManager.user) {
                await this.syncProgress();
            } else {
                this.deck = [...data];
                this.init();
            }
        } catch (e) {
            console.error("Failed to load deck:", e);
            alert("Failed to load vocabulary data. Please check connection.");
        }
    }

    async syncProgress() {
        if (!window.dbManager || !window.dbManager.user) {
            this.deck = [...this.allCards];
            this.init();
            return;
        }

        // Load SRS Data
        const srsData = await window.dbManager.getSRSData(this.deckId);
        const now = Date.now();

        // Filter: Show New (no data) OR Due (nextReview <= now)
        this.deck = this.allCards.filter(card => {
            const stats = srsData[card.word || card.Word];
            if (!stats) return true; // New card
            return stats.nextReview <= now; // Due card
        });

        console.log(`SRS Loaded: ${this.deck.length} cards due or new.`);

        this.init();

        // Check for deep link again in case the target word was filtered out (unlikely if searching, but possible)
        // If deep link, forcing it into the deck might be needed, but let's stick to standard flow.
    }

    init() {
        // Check for deep link
        const urlParams = new URLSearchParams(window.location.search);
        const targetWord = urlParams.get('word');

        if (targetWord) {
            let index = this.deck.findIndex(item => (item.word || item.Word) === targetWord);
            if (index === -1) {
                // If targeted word is not in due/new list, find it in allCards and add it temporarily
                const card = this.allCards.find(item => (item.word || item.Word) === targetWord);
                if (card) {
                    this.deck.unshift(card);
                    index = 0;
                }
            }
            if (index !== -1) this.currentIndex = index;
        }

        this.updateCard();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
    }

    bindEvents() {
        // Card Flip
        if (this.els.card) {
            this.els.card.addEventListener('click', () => this.flipCard());
        }

        // Global reference
        window.app = this;
    }

    flipCard() {
        if (this.deck.length === 0) return;
        this.isFlipped = !this.isFlipped;
        if (this.isFlipped) {
            this.els.card.classList.add('flipped');
        } else {
            this.els.card.classList.remove('flipped');
        }
    }

    resetFlip(callback) {
        if (this.isFlipped) {
            this.isFlipped = false;
            this.els.card.classList.remove('flipped');
            setTimeout(callback, 300); // Wait for transition
        } else {
            callback();
        }
    }

    setupQuizUI() {
        // Remove old container if it exists (cleanup)
        const oldContainer = document.querySelector('.quiz-btn-container');
        if (oldContainer) oldContainer.remove();

        if (document.querySelector('.fab-quiz')) return;

        // Create Floating Button for Quiz
        const btn = document.createElement('button');
        btn.className = 'fab-quiz';
        btn.onclick = () => location.href = `quiz.html?deck=${this.deckId}`;
        btn.innerHTML = `
            <span>🧠</span>
            <span>Quiz</span>
        `;

        document.body.appendChild(btn);
    }

    // --- Navigation & Grading ---

    markKnown(e) {
        if (e) e.stopPropagation();
        if (this.deck.length === 0) return;

        const currentWord = this.deck[this.currentIndex];

        this.resetFlip(() => {
            // SRS: Good (Pass) -> Schedule future
            if (window.dbManager) {
                // Use safe word property
                const wordText = currentWord.word || currentWord.Word;
                window.dbManager.saveSRS(this.deckId, wordText, 'good');
            }

            // Remove from current session
            this.deck.splice(this.currentIndex, 1);
            if (this.currentIndex >= this.deck.length) {
                this.currentIndex = 0;
            }
            this.updateCard();
        });
    }

    markUnknown(e) {
        if (e) e.stopPropagation();
        if (this.deck.length === 0) return;

        const currentWord = this.deck[this.currentIndex];

        this.resetFlip(() => {
            // SRS: Again (Fail) -> Interval 1 day
            if (window.dbManager) {
                const wordText = currentWord.word || currentWord.Word;
                window.dbManager.saveSRS(this.deckId, wordText, 'again');
            }

            // Move to end of session queue to review again TODAY
            this.deck.push(this.deck.splice(this.currentIndex, 1)[0]);
            // Don't increment index, implicitly the next card slides into currentIndex

            this.updateCard();
        });
    }

    prevCard(e) {
        if (e) e.stopPropagation();
        if (this.deck.length === 0) return;

        this.resetFlip(() => {
            this.currentIndex = (this.currentIndex - 1 + this.deck.length) % this.deck.length;
            this.updateCard();
        });
    }

    shuffleCards(e) {
        if (e) e.stopPropagation();
        if (this.deck.length === 0) return;

        this.resetFlip(() => {
            for (let i = this.deck.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]];
            }
            this.currentIndex = 0;
            this.updateCard();
        });
    }

    resetAll() {
        this.deck = [...this.allCards];
        this.currentIndex = 0;
        this.isFlipped = false;
        this.els.card.classList.remove('flipped');
        this.els.completedOverlay.style.display = 'none';
        this.updateCard();
    }

    // --- Render ---

    updateCard() {
        // Update counts
        if (this.els.remaining) {
            this.els.remaining.textContent = this.deck.length;
        }

        // Check completion
        if (this.deck.length === 0) {
            this.els.completedOverlay.style.display = 'flex';
            if (typeof Confetti !== 'undefined') {
                Confetti.celebrate();
            }
            return;
        } else {
            this.els.completedOverlay.style.display = 'none';
        }

        const item = this.deck[this.currentIndex];

        // Fill data
        // Handle different casing from different files (Word/word)
        const word = item.word || item.Word;
        const phonetic = item.phonetic || item.Phonetic || "";
        const translation = item.translation || item.Translation;
        const meaning = item.meaning || item.Meaning;

        this.els.word.textContent = word;
        this.els.phonetic.textContent = phonetic;
        this.els.translation.textContent = translation;
        this.els.meaning.innerHTML = meaning;
    }

    // --- Audio ---

    playAudio(e) {
        if (e) e.stopPropagation();
        if (this.synth.speaking) this.synth.cancel();
        if (this.deck.length === 0) return;

        const item = this.deck[this.currentIndex];
        const word = item.word || item.Word;

        const utterThis = new SpeechSynthesisUtterance(word);

        // Try to select a good English voice
        const preferred = this.voices.find(v => v.name.includes("Google US English")) ||
            this.voices.find(v => v.name.includes("Samantha")) ||
            this.voices.find(v => v.lang === "en-US");

        if (preferred) utterThis.voice = preferred;
        utterThis.lang = 'en-US';

        this.synth.speak(utterThis);
    }

    // --- Word List Feature ---

    setupWordListUI() {
        if (document.querySelector('.word-list-btn-container')) return;

        // 1. Create Floating Button
        const btnContainer = document.createElement('div');
        btnContainer.className = 'word-list-btn-container';
        btnContainer.innerHTML = `
            <button class="btn-word-list" onclick="app.openWordList()">
                <span>📖</span> List
            </button>
        `;
        document.body.appendChild(btnContainer);

        // 2. Create Modal Structure
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.id = 'word-list-modal';
        modal.style.display = 'none'; // Initial state
        modal.onclick = (e) => {
            if (e.target === modal) this.closeWordList();
        };

        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <div class="modal-title">Word List <span id="word-list-count"></span></div>
                    <button class="btn-close-modal" onclick="app.closeWordList()">✕</button>
                </div>
                <div class="word-list" id="word-list-container">
                    <!-- Items injected here -->
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    openWordList() {
        const modal = document.getElementById('word-list-modal');
        const container = document.getElementById('word-list-container');
        const countSpan = document.getElementById('word-list-count');

        // Update count
        if (countSpan) countSpan.textContent = `(${this.deck.length})`;

        // Populate list
        container.innerHTML = this.deck.map((item, index) => {
            const word = item.word || item.Word;
            const translation = item.translation || item.Translation;

            return `
                <div class="word-list-item ${index === this.currentIndex ? 'current' : ''}" 
                     onclick="app.jumpToCard(${index})">
                    <div>
                        <div class="list-word-main">${word}</div>
                        <div class="list-word-sub">${translation}</div>
                    </div>
                </div>
            `;
        }).join('');

        modal.style.display = 'flex';
        // Add active class after a small delay for animation if we had simple CSS transitions, 
        // but let's stick to display flex for now or use the CSS class logic I defined in style.css
        // Actually style.css had .modal-overlay.active logic.
        // Let's ensure style.css matches this logic.
        // In style.css I defined .modal-overlay { opacity: 0; visibility: hidden; } and .active { opacity: 1; ... }
        // So display: none might fight with it unless I remove display: none before adding active.

        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('active'), 10);
    }

    closeWordList() {
        const modal = document.getElementById('word-list-modal');
        if (modal) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300); // Wait for transition
        }
    }

    jumpToCard(index) {
        this.currentIndex = index;
        this.isFlipped = false;
        if (this.els.card) this.els.card.classList.remove('flipped');
        this.updateCard();
        this.closeWordList();
    }
}

// Keyboard shortcuts global handler
document.addEventListener('keydown', (e) => {
    if (!window.app) return;

    // Ignore if deck empty (handled inside methods but good check)

    if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        window.app.flipCard();
    } else if (e.code === 'ArrowRight') {
        window.app.markUnknown();
    } else if (e.code === 'ArrowLeft') {
        window.app.prevCard();
    } else if (e.code === 'ArrowUp') {
        window.app.markKnown(); // "Up" implies "Done/Away"
    } else if (e.key === 'a' || e.key === 's') {
        window.app.playAudio();
    }
});

// PWA Service Worker Registration
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/service-worker.js')
            .then((registration) => {
                console.log('ServiceWorker registration successful with scope: ', registration.scope);
            })
            .catch((err) => {
                console.log('ServiceWorker registration failed: ', err);
            });
    });
}
