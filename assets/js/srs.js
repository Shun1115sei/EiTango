class SRS {
    constructor() {
        this.defaultEase = 2.5;
    }

    /**
     * Calculate new SRS data based on performance
     * @param {object} currentStats - { interval, repetitions, ease } (can be null/undefined)
     * @param {string} grade - 'again' (fail) or 'good' (pass)
     * @returns {object} { nextReview, interval, repetitions, ease }
     */
    calculate(currentStats, grade) {
        let { interval, repetitions, ease } = currentStats || { interval: 0, repetitions: 0, ease: this.defaultEase };

        // Simplified Logic: 
        // 'again' = reset (Review / Unknown)
        // 'good' = pass (Got it)

        if (grade === 'again') {
            repetitions = 0;
            interval = 1; // Review tomorrow
            // Ease remains same or punish slightly? Let's keep it simple.
        } else if (grade === 'good') {
            repetitions += 1;

            if (repetitions === 1) {
                interval = 1;
            } else if (repetitions === 2) {
                interval = 6;
            } else {
                interval = Math.round(interval * ease);
            }
        }

        // Add interval days to current time for next review
        const nextReview = Date.now() + (interval * 24 * 60 * 60 * 1000);

        return {
            nextReview: nextReview,
            interval: interval,
            repetitions: repetitions,
            ease: ease
        };
    }
}

window.SRS = new SRS();
