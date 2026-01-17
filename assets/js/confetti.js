
const Confetti = (function () {
  const colors = ['#f39c12', '#e74c3c', '#2ecc71', '#3498db', '#9b59b6', '#1abc9c'];

  function random(min, max) {
    return Math.random() * (max - min) + min;
  }

  function createPiece(x, y) {
    const piece = document.createElement('div');
    piece.style.position = 'fixed';
    piece.style.left = x + 'px';
    piece.style.top = y + 'px';
    piece.style.width = random(6, 12) + 'px';
    piece.style.height = random(6, 12) + 'px';
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.borderRadius = '50%';
    piece.style.pointerEvents = 'none';
    piece.style.zIndex = '9999';
    document.body.appendChild(piece);

    const angle = random(0, Math.PI * 2);
    const velocity = random(2, 6);
    const vx = Math.cos(angle) * velocity;
    const vy = Math.sin(angle) * velocity - 4; // Initial upward pop

    let opacity = 1;

    const animate = () => {
      const left = parseFloat(piece.style.left);
      const top = parseFloat(piece.style.top);

      piece.style.left = (left + vx) + 'px';
      piece.style.top = (top + vy + 2) + 'px'; // Gravity
      piece.style.opacity = opacity;

      opacity -= 0.02;

      if (opacity > 0) {
        requestAnimationFrame(animate);
      } else {
        piece.remove();
      }
    };

    requestAnimationFrame(animate);
  }

  function explode(x, y) {
    for (let i = 0; i < 60; i++) {
        createPiece(x, y); // Multiple pieces for explosion
    }
  }
  
  function rain() {
      const width = window.innerWidth;
      const interval = setInterval(() => {
          createPiece(random(0, width), window.innerHeight + 10); // Start from bottom or spawn random
           // Logic tweak: spawn from random top spots for rain, or center for explosion
      }, 50);
      
      // Stop after 3 seconds
      setTimeout(() => clearInterval(interval), 3000);
  }
  
  function celebrate() {
      const centerX = window.innerWidth / 2;
      const centerY = window.innerHeight / 2;
      
      // Bursts
      let count = 0;
      const interval = setInterval(() => {
          explode(centerX + random(-100, 100), centerY + random(-100, 100));
          count++;
          if(count > 10) clearInterval(interval);
      }, 300);
  }

  return {
    celebrate: celebrate
  };
})();
