const express = require('express');
const session = require('express-session');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middlewares
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
  secret: 'secret-key', // Change this in production!
  resave: false,
  saveUninitialized: true
}));

// Load or initialize users from a JSON file
let users = [];
const USERS_FILE = 'users.json';

if (fs.existsSync(USERS_FILE)) {
  users = JSON.parse(fs.readFileSync(USERS_FILE));
}

function saveUsers() {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Middleware: Check if user is authenticated
function requireAuth(req, res, next) {
  if (req.session && req.session.userId) {
    return next();
  } else {
    res.redirect('/login.html');
  }
}

// Middleware: Check if user is admin (for demo, admin username is "admin")
function requireAdmin(req, res, next) {
  if (req.session && req.session.username === 'admin') {
    return next();
  } else {
    res.status(403).send('Access denied. Admins only.');
  }
}

// Sign-Up Endpoint
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Missing username or password');
  }
  // Check if the user exists
  const existingUser = users.find(u => u.username === username);
  if (existingUser) {
    return res.status(400).send('Username already exists');
  }
  // Hash the password and create a new user (starting with 0 coins)
  const hashedPassword = await bcrypt.hash(password, 10);
  const newUser = { id: Date.now(), username, password: hashedPassword, coins: 0 };
  users.push(newUser);
  saveUsers();
  req.session.userId = newUser.id;
  req.session.username = newUser.username;
  res.redirect('/casino.html');
});

// Login Endpoint
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).send('User not found');
  }
  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    return res.status(400).send('Incorrect password');
  }
  req.session.userId = user.id;
  req.session.username = user.username;
  res.redirect('/casino.html');
});

// Logout Endpoint
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login.html');
});

// API Endpoint to fetch current user info (coins, username)
app.get('/api/me', requireAuth, (req, res) => {
  const user = users.find(u => u.id === req.session.userId);
  if (user) {
    res.json({ username: user.username, coins: user.coins });
  } else {
    res.status(404).json({ error: "User not found" });
  }
});

// Casino route (serves the casino page)
app.get('/casino', requireAuth, (req, res) => {
  res.sendFile(path.join(__dirname, 'public/casino.html'));
});

// Admin dashboard to view users and manually add coins
app.get('/admin', requireAuth, requireAdmin, (req, res) => {
  let html = '<h1>Admin Dashboard</h1>';
  html += '<table border="1"><tr><th>Username</th><th>Coins</th><th>Add Coins</th></tr>';
  users.forEach(user => {
    if (user.username !== 'admin') { // skip admin account
      html += `<tr>
        <td>${user.username}</td>
        <td>${user.coins}</td>
        <td>
          <form action="/admin/add" method="POST" style="display:inline;">
            <input type="hidden" name="username" value="${user.username}" />
            <input type="number" name="coins" placeholder="coins" required />
            <button type="submit">Add</button>
          </form>
        </td>
      </tr>`;
    }
  });
  html += '</table>';
  html += `<p><a href="/casino.html">Back to Casino</a></p>`;
  res.send(html);
});

// Admin endpoint to add coins
app.post('/admin/add', requireAuth, requireAdmin, (req, res) => {
  const { username, coins } = req.body;
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).send('User not found');
  }
  user.coins += parseInt(coins, 10);
  saveUsers();
  res.redirect('/admin');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
