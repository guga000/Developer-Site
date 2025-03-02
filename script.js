const symbols = ["🍒", "🍋", "🍊", "🍉", "⭐", "💎"];

document.getElementById('spin').addEventListener('click', () => {
  const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
  const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
  const slot3 = symbols[Math.floor(Math.random() * symbols.length)];

  document.getElementById('slot1').textContent = slot1;
  document.getElementById('slot2').textContent = slot2;
  document.getElementById('slot3').textContent = slot3;

  const resultText = (slot1 === slot2 && slot2 === slot3) ? "You win!" : "Try again!";
  document.getElementById('result').textContent = resultText;
});
