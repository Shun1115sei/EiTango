class QuizApp {
    constructor() {
        this.deck = [];
        this.currentQuestionIndex = 0;
        this.score = 0;
        this.totalQuestions = 10; // Fixed session size

        this.els = {
            loading: document.getElementById('loading'),
            questionArea: document.getElementById('question-area'),
            resultArea: document.getElementById('result-area'),
            word: document.getElementById('q-word'),
            options: document.getElementById('q-options'),
            score: document.getElementById('score-display'),
            finalScore: document.getElementById('final-score')
        };

        this.init();
    }

    async init() {
        const urlParams = new URLSearchParams(window.location.search);
        const deckId = urlParams.get('deck') || '5000_15';

        try {
            let data = [];

            if (deckId === 'all') {
                if (this.els.loading) this.els.loading.textContent = "Loading ALL Decks...";
                data = await this.loadAllDecks();
            } else {
                const res = await fetch(`assets/data/${deckId}.json`);
                if (!res.ok) throw new Error('Failed to load');
                data = await res.json();
            }

            // Shuffle full deck
            this.fullDeck = data.sort(() => Math.random() - 0.5);

            // Select questions
            this.questions = this.fullDeck.slice(0, Math.min(this.totalQuestions, data.length));
            this.totalQuestions = this.questions.length;

            this.els.loading.style.display = 'none';
            this.els.questionArea.style.display = 'block';
            this.updateScore();
            this.showQuestion();

        } catch (e) {
            if (this.els.loading) this.els.loading.textContent = "Error loading quiz data.";
            console.error(e);
        }
    }

    async loadAllDecks() {
        const deckIds = [
            '5000_2-3', '5000_3-4', '5000_4', '5000_5', '5000_6', '5000_7', '5000_8',
            '5000_9', '5000_10', '5000_11', '5000_12', '5000_13', '5000_14', '5000_15',
            'kyukyoku_5000-5200'
        ];

        const promises = deckIds.map(async id => {
            try {
                const res = await fetch(`assets/data/${id}.json`);
                if (!res.ok) return [];
                return await res.json();
            } catch (e) { return []; }
        });

        const results = await Promise.all(promises);
        return results.flat();
    }

    updateScore() {
        this.els.score.textContent = `Score: ${this.score} / ${this.totalQuestions}`;
    }

    showQuestion() {
        if (this.currentQuestionIndex >= this.totalQuestions) {
            this.endQuiz();
            return;
        }

        const currentItem = this.questions[this.currentQuestionIndex];
        const correctWord = currentItem.word || currentItem.Word;
        const correctMeaning = currentItem.translation || currentItem.Translation; // Simple translation quiz

        this.els.word.textContent = correctWord;

        // Generate distractors
        const distractors = this.fullDeck
            .filter(item => (item.word || item.Word) !== correctWord)
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(item => item.translation || item.Translation);

        // Combine and shuffle
        const options = [...distractors, correctMeaning].sort(() => Math.random() - 0.5);

        this.els.options.innerHTML = '';

        options.forEach(opt => {
            const btn = document.createElement('div');
            btn.className = 'quiz-option';
            btn.textContent = opt;
            btn.onclick = () => this.handleAnswer(btn, opt === correctMeaning);
            this.els.options.appendChild(btn);
        });
    }

    handleAnswer(btn, isCorrect) {
        // Disable all
        const allBtns = this.els.options.children;
        for (let b of allBtns) {
            b.onclick = null;
            if (b.textContent === (this.questions[this.currentQuestionIndex].translation || this.questions[this.currentQuestionIndex].Translation)) {
                b.classList.add('correct');
            }
        }

        if (isCorrect) {
            // btn.classList.add('correct'); // Already handled above logic
            this.score++;
            if (typeof Confetti !== 'undefined') Confetti.celebrate();
        } else {
            btn.classList.add('incorrect');
        }

        this.currentQuestionIndex++;
        this.updateScore();

        setTimeout(() => {
            this.showQuestion();
        }, 1500);
    }

    endQuiz() {
        this.els.questionArea.style.display = 'none';
        this.els.resultArea.style.display = 'block';
        this.els.finalScore.textContent = `${this.score} / ${this.totalQuestions}`;
        this.els.score.style.display = 'none';
    }
}

new QuizApp();
