# ⚔️ LeetBattle — Settle the Rivalry

A head-to-head LeetCode comparison dashboard that tracks two profiles in real time. Stay motivated by seeing who's ahead and by how much.

## What's New in v2.0

- **Redesigned UI** — new duel-style landing page with *YOU vs RIVAL* seats
- **Custom SVG icon system** — emoji replaced with hand-tuned SVG icons across every button and section header
- **Typography overhaul** — Space Grotesk headings, Inter body text, JetBrains Mono for stats
- **Animated counters** — number values ease into place instead of snapping
- **Updated color palette** — cyan/amber accent bars in charts replacing the old blue/purple scheme
- **Smarter input handling** — case-insensitive duplicate check, prefilled inputs from last session
- **Polish pass** — updated meta descriptions, tagline copy, and footer note

## Features

- **Real-time Comparison** — side-by-side profile stats with live status indicators
- **Difficulty Breakdown** — Easy / Medium / Hard solved counts with progress rings
- **7-Day Activity Chart** — canvas bar chart showing daily submissions for both users
- **Recent Solves** — latest accepted problems per user
- **Auto-refresh** — every 30 s with a visible countdown, toggleable
- **Persistent Storage** — usernames saved in `localStorage` for quick reloads
- **Responsive Design** — fully usable on desktop, tablet, and mobile

## Tech Stack

| Layer    | Technology |
|----------|------------|
| Backend  | Python · Flask · GraphQL proxy |
| Frontend | HTML5 · CSS3 · Vanilla JS |
| API      | LeetCode public GraphQL endpoint |
| Fonts    | Space Grotesk · Inter · JetBrains Mono (Google Fonts) |

## Getting Started

### Prerequisites

- Python 3.7+
- pip

### Install

```bash
cd leet-battle
pip install -r requirements.txt
```

### Run

**1 — Start the API server**

```bash
python leetbattle_api.py
```

You should see:

```
🚀 LeetBattle API Server Starting...
📡 Server running on http://localhost:5000
```

**2 — Serve the frontend** (in a second terminal)

```bash
python -m http.server 8000
```

**3 — Open** → [http://localhost:8000](http://localhost:8000)

## Usage

1. Enter your LeetCode handle in the **YOU** field and your rival's in the **RIVAL** field.
2. Click **Enter the arena**.
3. The dashboard loads with live stats, charts, and a head-to-head breakdown.
4. Data refreshes automatically every 30 seconds (toggle with the switch).
5. Hit **Refresh** to update instantly, or **Change** to pick different handles.

## Status Indicators

| Badge   | Meaning |
|---------|---------|
| 🟢 Leading  | You're ahead in that metric |
| 🔴 Trailing | You're behind |
| 🟡 Tied     | Equal progress |

## API Endpoints

### Get User Statistics

```
GET /api/user/<username>
```

**Response:**

```json
{
  "username": "example_user",
  "ranking": 12345,
  "reputation": 100,
  "totalSolved": 500,
  "easySolved": 200,
  "mediumSolved": 250,
  "hardSolved": 50,
  "acceptanceRate": 45.5,
  "recentAccepted": 15,
  "totalSubmissions": 1100
}
```

### Health Check

```
GET /api/health
```

## Project Structure

```
leet-battle/
├── leetbattle_api.py       # Flask backend – proxies LeetCode GraphQL
├── index.html              # Landing page (duel-style input)
├── dashboard.html          # Comparison dashboard
├── style.css               # Global design tokens, landing page styles
├── dashboard-styles.css    # Dashboard-specific layout & components
├── dashboard.js            # Core app logic, chart rendering, animations
├── leetbattle.bat          # Windows one-click launcher
├── create_shortcut.ps1     # Creates a desktop shortcut (Windows)
├── requirements.txt        # Python dependencies (Flask, requests)
└── README.md               # You are here
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `ModuleNotFoundError: No module named 'flask'` | `pip install -r requirements.txt` |
| Port 5000 in use | Stop the other process or change the port in `leetbattle_api.py` |
| Can't connect to API | Make sure the backend is running on `http://localhost:5000` |
| User not found | Double-check the LeetCode username (case-sensitive) |
| Page won't load | Access via `http://localhost:8000`, not `file://` |

## Browser Compatibility

Chrome · Firefox · Edge · Safari · Opera

## Notes

- LeetCode usernames are case-sensitive
- Uses LeetCode's public GraphQL API — no authentication required
- All data is fetched in real time; nothing is stored on the server

## Future Enhancements

- Contest rating comparison
- Submission calendar heatmap
- Historical progress tracking
- Multi-user comparison (3+ users)
- Light / dark theme toggle
- Export comparison as shareable image

## License

This project is for educational and personal use.

---

**Built with ⚔️ for competitive coders**
