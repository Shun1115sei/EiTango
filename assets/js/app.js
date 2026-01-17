
class FlashcardApp {
    constructor(data, options = {}) {
        this.allCards = data; // Original source
        this.deck = [...data]; // Working deck
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

        // Initial render
        this.setupWordListUI();
        this.updateCard();
    }

    loadVoices() {
        this.voices = this.synth.getVoices();
    }

    bindEvents() {
        // Card Flip
        this.els.card.addEventListener('click', () => this.flipCard());

        // Audio Button (stop propagation)
        // Note: The HTML must have onclick="app.playAudio(event)" or similar, 
        // OR we bind it here if we querySelector it every time? 
        // Better: Event delegation or expect the button to exist.
        // For simplicity with the template, we'll attach listeners dynamically or globally.
        // Let's attach global helpers for the HTML onclick handlers to find this instance.
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

    // --- Navigation & Grading ---

    markKnown(e) {
        if (e) e.stopPropagation();
        if (this.deck.length === 0) return;

        this.resetFlip(() => {
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

        this.resetFlip(() => {
            this.currentIndex = (this.currentIndex + 1) % this.deck.length;
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
