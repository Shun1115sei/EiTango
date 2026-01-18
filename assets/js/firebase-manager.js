class FirebaseManager {
    constructor() {
        this.auth = null;
        this.db = null;
        this.user = null;
        this.unsubscribe = null;

        if (typeof firebase !== 'undefined') {
            this.auth = firebase.auth();
            this.db = firebase.firestore();

            // Set persistence to LOCAL explicitly
            this.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL)
                .then(() => {
                    this.initAuthListener();

                    // Check for redirect result
                    return this.auth.getRedirectResult();
                })
                .then((result) => {
                    if (result && result.user) {
                        console.log("Redirect Login Success:", result.user.uid);
                        this.user = result.user;
                        this.updateUI(true);
                    }
                })
                .catch((error) => {
                    console.error("Redirect Login Failed:", error);
                    alert("Login Error: " + error.message);
                });
        }
    }

    initAuthListener() {
        this.auth.onAuthStateChanged((user) => {
            if (user) {
                console.log("User logged in:", user.uid);
                this.user = user;
                this.updateUI(true);
                // Trigger sync if app exists
                if (window.app) window.app.syncProgress();
            } else {
                console.log("User logged out");
                this.user = null;
                this.updateUI(false);
            }
        });
    }

    login() {
        if (this.isLoggingIn) return; // Prevent double clicks
        this.isLoggingIn = true;

        const provider = new firebase.auth.GoogleAuthProvider();

        // Force Redirect for ALL devices to ensure stability and avoid popup conflicts
        this.auth.signInWithRedirect(provider).catch((error) => {
            this.isLoggingIn = false;
            console.error("Redirect Login Failed:", error);
            alert("Login initialization failed: " + error.message);
        });
    }

    logout() {
        this.auth.signOut();
    }

    updateUI(isLoggedIn) {
        this.isLoggingIn = false; // Reset flag on UI update
        const loginBtn = document.getElementById('login-btn');
        const userIcon = document.getElementById('user-icon');

        if (loginBtn && userIcon) {
            if (isLoggedIn) {
                loginBtn.style.display = 'none';
                userIcon.style.display = 'flex';
                if (this.user.photoURL) {
                    userIcon.innerHTML = `<img src="${this.user.photoURL}" alt="User" style="width:100%; height:100%; border-radius:50%;">`;
                }
            } else {
                loginBtn.style.display = 'flex';
                userIcon.style.display = 'none';
            }
        }
    }

    // --- Firestore Operations ---

    // Save SRS Progress
    async saveSRS(deckId, word, grade) {
        if (!this.user || !this.db) {
            // Fallback to local storage or just memory? 
            // For now, if no auth, we can't do persistent SRS across devices.
            console.warn("User not logged in, cannot save SRS.");
            return;
        }

        try {
            const deckRef = this.db.collection('users').doc(this.user.uid).collection('srs_decks').doc(deckId);

            // Get current stats first
            // Note: In a real high-traffic app we might simple write, but here we need read-modify-write for the Algo.
            // But we can cache it in memory (app.js) or just read it.
            // Let's read the doc.

            const doc = await deckRef.get();
            let data = doc.exists ? doc.data() : {};
            let currentStats = data[word]; // might be undefined

            // Calculate new stats
            // We assume SRS.js is loaded
            if (typeof window.SRS !== 'undefined') {
                const newStats = window.SRS.calculate(currentStats, grade);

                // Update map
                await deckRef.set({
                    [word]: newStats
                }, { merge: true });

                console.log(`Saved SRS for [${word}]: Next review in ${newStats.interval} days.`);
            }
        } catch (e) {
            console.error("Error saving SRS:", e);
        }
    }

    // Get all SRS data for a deck
    async getSRSData(deckId) {
        if (!this.user || !this.db) return {};
        try {
            const doc = await this.db.collection('users').doc(this.user.uid).collection('srs_decks').doc(deckId).get();
            return doc.exists ? doc.data() : {};
        } catch (e) {
            console.error("Error fetching SRS data:", e);
            return {};
        }
    }

    // Legacy support (optional)
    async getKnownWords(deckId) {
        // We might want to consider words with interval > X as "known"?
        // Or just stop using this legacy method.
        // For now, return empty to not break app.js calls if any.
        return [];
    }
}

const dbManager = new FirebaseManager();
