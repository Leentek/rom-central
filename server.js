const express = require('express');
const cors = require('cors');
const fs = require('fs');
const bodyParser = require('body-parser');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(bodyParser.json());

const ADMIN_CREDENTIALS = {
    username: "admin",
    password: "admin123"
};

const GAMES_FILE = 'games.json';

function initializeGamesFile() {
    if (!fs.existsSync(GAMES_FILE)) {
        fs.writeFileSync(GAMES_FILE, JSON.stringify({ games: [], blogPosts: [] }, null, 2));
        return;
    }

    try {
        const data = JSON.parse(fs.readFileSync(GAMES_FILE, 'utf8'));
        let needsUpdate = false;

        // Existing games initialization
        if (data.games && data.games.some(game => !game.views)) {
            data.games = data.games.map(game => ({
                ...game,
                views: game.views || Math.floor(Math.random() * 200) + 50
            }));
            needsUpdate = true;
        }

        // Initialize blogPosts array if it doesn't exist
        if (!data.blogPosts) {
            data.blogPosts = [];
            needsUpdate = true;
        }

        if (needsUpdate) {
            fs.writeFileSync(GAMES_FILE, JSON.stringify(data, null, 2));
            console.log('Data file initialized!');
        }
    } catch (error) {
        console.error('Error initializing games file:', error);
    }
}

initializeGamesFile();

function readGames() {
    const data = fs.readFileSync(GAMES_FILE, 'utf8');
    return JSON.parse(data);
}

function writeGames(data) {
    fs.writeFileSync(GAMES_FILE, JSON.stringify(data, null, 2));
}

// Endpoints
app.post('/login', (req, res) => {
    const { username, password } = req.body;
    if (username === ADMIN_CREDENTIALS.username && password === ADMIN_CREDENTIALS.password) {
        res.json({ success: true, token: "dummy-token" });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

// Unified games endpoint with optional pagination
app.get('/games', (req, res) => {
    try {
        const data = readGames();
        let games = data.games;

        // Filter by search query
        if (req.query.q) {
            const query = req.query.q.toLowerCase();
            games = games.filter(game => 
                game.title.toLowerCase().includes(query) ||
                game.description.toLowerCase().includes(query) ||
                (game.genre && game.genre.some(g => g.toLowerCase().includes(query)))
            );
        }

        // Filter by platform
        if (req.query.platform) {
            games = games.filter(game => 
                game.platform && game.platform.toLowerCase() === req.query.platform.toLowerCase()
            );
        }

        // Bypass pagination when ?all=true or for specific use cases
        if (req.query.all === 'true' || req.query.bypassPagination === 'true') {
            return res.json({ games: games });
        }

        // Default pagination for admin
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const paginatedGames = games.slice(
            (page - 1) * limit,
            page * limit
        );

        res.json({
            totalGames: games.length,
            totalPages: Math.ceil(games.length / limit),
            currentPage: page,
            games: paginatedGames
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to read games" });
    }
});

// Additional endpoint for all games (alternative to ?all=true)
app.get('/all-games', (req, res) => {
    try {
        const data = readGames();
        res.json(data.games);
    } catch (error) {
        res.status(500).json({ error: "Failed to read games" });
    }
});

// Existing endpoints
app.get('/games/:id', (req, res) => {
    try {
        const data = readGames();
        const game = data.games.find(g => g.id == req.params.id);
        if (!game) {
            return res.status(404).json({ error: "Game not found" });
        }
        res.json(game);
    } catch (error) {
        res.status(500).json({ error: "Failed to get game" });
    }
});

app.post("/games", (req, res) => {
    try {
        const data = readGames();
        const newGame = {
            id: Date.now().toString(),
            views: Math.floor(Math.random() * 200) + 50,
            ...req.body
        };
        data.games.push(newGame);
        writeGames(data);
        res.status(201).json(newGame);
    } catch (error) {
        res.status(500).json({ error: "Failed to add game" });
    }
});

app.put("/games/:id", (req, res) => {
    try {
        const data = readGames();
        const gameIndex = data.games.findIndex(g => g.id == req.params.id);
        if (gameIndex === -1) {
            return res.status(404).json({ error: "Game not found" });
        }
        data.games[gameIndex] = { 
            ...data.games[gameIndex],
            ...req.body,
            id: req.params.id
        };
        writeGames(data);
        res.json(data.games[gameIndex]);
    } catch (error) {
        res.status(500).json({ error: "Failed to update game" });
    }
});

app.delete('/games/:id', (req, res) => {
    try {
        const data = readGames();
        const initialLength = data.games.length;
        data.games = data.games.filter(game => game.id != req.params.id);
        if (data.games.length === initialLength) {
            return res.status(404).json({ error: "Game not found" });
        }
        writeGames(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete game" });
    }
});

// Add these endpoints to your server.js file (before app.listen)

// Blog Post Endpoints
app.get('/blog-posts', (req, res) => {
    try {
        const data = readGames(); // Reusing the same file for simplicity
        let posts = data.blogPosts || [];
        
        // Pagination
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const paginatedPosts = posts.slice(
            (page - 1) * limit,
            page * limit
        );

        res.json({
            totalPosts: posts.length,
            totalPages: Math.ceil(posts.length / limit),
            currentPage: page,
            posts: paginatedPosts
        });
    } catch (error) {
        res.status(500).json({ error: "Failed to read blog posts" });
    }
});

app.get('/blog-posts/:id', (req, res) => {
    try {
        const data = readGames();
        const post = (data.blogPosts || []).find(p => p.id == req.params.id);
        if (!post) {
            return res.status(404).json({ error: "Post not found" });
        }
        res.json(post);
    } catch (error) {
        res.status(500).json({ error: "Failed to get post" });
    }
});

app.post("/blog-posts", (req, res) => {
    try {
        const data = readGames();
        if (!data.blogPosts) data.blogPosts = [];
        
        const newPost = {
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            ...req.body
        };
        data.blogPosts.push(newPost);
        writeGames(data);
        res.status(201).json(newPost);
    } catch (error) {
        res.status(500).json({ error: "Failed to add post" });
    }
});

app.put("/blog-posts/:id", (req, res) => {
    try {
        const data = readGames();
        if (!data.blogPosts) data.blogPosts = [];
        
        const postIndex = data.blogPosts.findIndex(p => p.id == req.params.id);
        if (postIndex === -1) {
            return res.status(404).json({ error: "Post not found" });
        }
        
        data.blogPosts[postIndex] = { 
            ...data.blogPosts[postIndex],
            ...req.body,
            id: req.params.id,
            updatedAt: new Date().toISOString()
        };
        
        writeGames(data);
        res.json(data.blogPosts[postIndex]);
    } catch (error) {
        res.status(500).json({ error: "Failed to update post" });
    }
});

app.delete('/blog-posts/:id', (req, res) => {
    try {
        const data = readGames();
        if (!data.blogPosts) data.blogPosts = [];
        
        const initialLength = data.blogPosts.length;
        data.blogPosts = data.blogPosts.filter(post => post.id != req.params.id);
        if (data.blogPosts.length === initialLength) {
            return res.status(404).json({ error: "Post not found" });
        }
        writeGames(data);
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete post" });
    }
});



app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});