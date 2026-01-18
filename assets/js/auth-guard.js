// Auth Guard - Include this on all protected pages
// Redirects to login.html if user is not authenticated

(function () {
    // Skip if we're already on the login page
    if (window.location.pathname.endsWith('login.html')) {
        return;
    }

    // Check auth state
    if (typeof firebase !== 'undefined') {
        firebase.auth().onAuthStateChanged((user) => {
            if (!user) {
                // Not logged in, redirect to login page
                window.location.href = 'login.html';
            }
        });
    }
})();
