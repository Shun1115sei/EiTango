class GlobalSearch {
    constructor() {
        this.allWords = []; // { word, translation, deckMeta, deckId }
        this.isLoaded = false;

        // Deck Metadata matching filenames
        this.decks = [
            { id: '5000_2-3', title: 'Biology: Flora & Fauna' },
            { id: '5000_3-4', title: 'Biology: Plants & Insects' },
            { id: '5000_4', title: 'Biology: Insects' },
            { id: '5000_5', title: 'Physiology & Anatomy' },
            { id: '5000_6', title: 'Medicine & Health' },
            { id: '5000_7', title: 'Physics' },
            { id: '5000_8', title: 'Chemistry' },
            { id: '5000_9', title: 'Environment & Ecology' },
            { id: '5000_10', title: 'Meteorology' },
            { id: '5000_11', title: 'Astronomy' },
            { id: '5000_12', title: 'Geography & Geology' },
            { id: '5000_13', title: 'Resources & Energy' },
            { id: '5000_14', title: 'Politics & Diplomacy' },
            { id: '5000_15', title: 'Economics' },
            { id: 'kyukyoku_5000-5200', title: 'Ultimate: 5000-5200' },
        ];

        this.initUI();
    }

    async loadAllData() {
        if (this.isLoaded) return;

        const promises = this.decks.map(async (deck) => {
            try {
                const res = await fetch(`assets/data/${deck.id}.json`);
                if (!res.ok) return [];
                const data = await res.json();
                return data.map(item => ({
                    word: item.word || item.Word,
                    translation: item.translation || item.Translation,
                    deckId: deck.id,
                    deckTitle: deck.title
                }));
            } catch (e) {
                console.warn(`Failed to load ${deck.id}`, e);
                return [];
            }
        });

        const results = await Promise.all(promises);
        this.allWords = results.flat();
        this.isLoaded = true;
        console.log(`Indexed ${this.allWords.length} words.`);
    }

    initUI() {
        // Create Search Modal
        const modal = document.createElement('div');
        modal.className = 'search-modal-overlay';
        modal.innerHTML = `
            <div class="search-modal">
                <div class="search-header">
                    <input type="text" id="global-search-input" placeholder="Search words..." autocomplete="off">
                    <button id="close-search">✕</button>
                </div>
                <div id="search-results" class="search-results"></div>
            </div>
        `;
        document.body.appendChild(modal);

        this.els = {
            modal: modal,
            input: modal.querySelector('#global-search-input'),
            results: modal.querySelector('#search-results'),
            closeBtn: modal.querySelector('#close-search')
        };

        // Event Listeners
        this.els.closeBtn.onclick = () => this.close();
        this.els.modal.onclick = (e) => {
            if (e.target === this.els.modal) this.close();
        };

        this.els.input.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Keyboard shortcut within modal
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') this.close();
        });
    }

    open() {
        this.els.modal.style.display = 'flex';
        this.els.input.focus();
        this.loadAllData(); // Lazy load
    }

    close() {
        this.els.modal.style.display = 'none';
        this.els.input.value = '';
        this.els.results.innerHTML = '';
    }

    handleSearch(query) {
        if (!query || query.length < 2) {
            this.els.results.innerHTML = '';
            return;
        }

        const lowerQ = query.toLowerCase();
        const matches = this.allWords.filter(item =>
            item.word.toLowerCase().includes(lowerQ) ||
            (item.translation && item.translation.includes(lowerQ))
        ).slice(0, 50); // Limit results

        this.renderResults(matches);
    }

    renderResults(items) {
        if (items.length === 0) {
            this.els.results.innerHTML = '<div class="no-results">No words found.</div>';
            return;
        }

        const html = items.map(item => `
            <div class="search-item" onclick="window.location.href='${item.deckId}.html?word=${encodeURIComponent(item.word)}'">
                <div class="search-word-row">
                    <span class="search-word">${item.word}</span>
                    <span class="search-translation">${item.translation}</span>
                </div>
                <div class="search-deck-info">${item.deckTitle}</div>
            </div>
        `).join('');

        this.els.results.innerHTML = html;
    }
}

// Attach to window
window.GlobalSearch = GlobalSearch;

// Init if on valid page
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.searchApp = new GlobalSearch();
    });
} else {
    window.searchApp = new GlobalSearch();
}
