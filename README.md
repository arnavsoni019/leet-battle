# LeetBattle - Profile Comparison Website

A beautiful, real-time comparison dashboard to track your LeetCode progress against your friend's profile with LeetBattle. Stay motivated by seeing who's ahead and by how much!

## Features

✨ **Real-time Comparison** - Compare two LeetCode profiles side-by-side
📊 **Detailed Statistics** - View total problems solved, acceptance rate, ranking, and more
🎯 **Difficulty Breakdown** - See progress across Easy, Medium, and Hard problems
🔄 **Auto-refresh** - Automatically updates every 30 seconds to show current stats
💾 **Persistent Storage** - Saves usernames locally for quick access
🎨 **Beautiful UI** - Modern dark theme with glassmorphism and smooth animations
📱 **Responsive Design** - Works perfectly on desktop, tablet, and mobile

## Tech Stack

- **Backend**: Python Flask with GraphQL integration
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **API**: LeetCode's public GraphQL endpoint
- **Styling**: Custom CSS with modern design patterns

## Installation

### Prerequisites

- Python 3.7 or higher
- pip (Python package manager)

### Setup Steps

1. **Navigate to the project directory**
   ```bash
   cd a:\Python\leetcode-compare
   ```

2. **Install Python dependencies**
   ```bash
   pip install -r requirements.txt
   ```

## Running the Application

### Step 1: Start the Backend Server

Open a terminal and run:

```bash
cd a:\Python\leetcode-compare
python api.py
```

You should see:
```
🚀 LeetBattle API Server Starting...
📡 Server running on http://localhost:5000
```

### Step 2: Start the Frontend Server

Open a **new terminal** and run:

```bash
cd a:\Python\leetcode-compare
python -m http.server 8000
```

### Step 3: Open in Browser

Navigate to: **http://localhost:8000**

## Usage

1. **Enter Usernames**: Type your LeetCode username in the left field and your friend's username in the right field
2. **Compare**: Click the "Compare Profiles" button
3. **View Results**: See detailed statistics and who's ahead
4. **Auto-refresh**: The dashboard automatically updates every 30 seconds (can be toggled off)
5. **Manual Refresh**: Click the "Refresh Now" button to update immediately

## Features Explained

### Status Indicators
- 🟢 **Leading** - Green badge shows you're ahead
- 🔴 **Trailing** - Red badge shows you're behind
- 🟡 **Tied** - Yellow badge shows equal progress

### Statistics Displayed
- **Total Solved** - Total number of problems solved
- **Acceptance Rate** - Percentage of accepted submissions
- **Recent Accepted** - Number of recently accepted submissions
- **Reputation** - LeetCode reputation points
- **Ranking** - Global LeetCode ranking
- **Difficulty Breakdown** - Problems solved by difficulty (Easy/Medium/Hard)

### Auto-refresh
- Automatically fetches new data every 30 seconds
- Shows countdown timer
- Can be toggled on/off
- Manual refresh button available

### Local Storage
- Usernames are saved in browser
- Automatically loads last comparison on page refresh
- No need to re-enter usernames

## Troubleshooting

### Backend Issues

**Problem**: `ModuleNotFoundError: No module named 'flask'`
**Solution**: Install dependencies with `pip install -r requirements.txt`

**Problem**: Port 5000 already in use
**Solution**: Stop other applications using port 5000 or modify the port in `api.py`

### Frontend Issues

**Problem**: Can't connect to API
**Solution**: Make sure the backend server is running on http://localhost:5000

**Problem**: User not found
**Solution**: Verify the LeetCode username is correct (case-sensitive)

### Browser Issues

**Problem**: Page not loading
**Solution**: Make sure you're accessing http://localhost:8000 (not file://)

**Problem**: Data not refreshing
**Solution**: Check browser console for errors and ensure backend is running

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
leetcode-compare/
├── api.py              # Flask backend server
├── index.html          # Main HTML structure
├── style.css           # Styling and animations
├── script.js           # Frontend logic
├── requirements.txt    # Python dependencies
└── README.md          # This file
```

## Browser Compatibility

- ✅ Chrome (recommended)
- ✅ Firefox
- ✅ Edge
- ✅ Safari
- ✅ Opera

## Notes

- LeetCode usernames are case-sensitive
- The app uses LeetCode's public GraphQL API (no authentication required)
- Data is fetched in real-time from LeetCode servers
- No data is stored on the server (privacy-friendly)

## Future Enhancements

- Contest ratings comparison
- Submission calendar heatmap
- Historical progress tracking
- Multiple user comparison (3+ users)
- Dark/light theme toggle
- Export comparison as image

## License

This project is for educational and personal use.

---

**Built with 💪 for competitive coders**
