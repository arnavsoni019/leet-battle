from flask import Flask, jsonify
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import json

app = Flask(__name__)
CORS(app)

LEETCODE_GRAPHQL_URL = "https://leetcode.com/graphql/"

def fetch_detailed_leetcode_data(username):
    """Fetch detailed user data including calendar and recent problems"""
    
    current_year = datetime.now().year
    
    # Correct query: userCalendar(year) is nested under matchedUser
    query = """
    query getUserProfile($username: String!, $year: Int) {
        allQuestionsCount {
            difficulty
            count
        }
        matchedUser(username: $username) {
            username
            profile {
                ranking
            }
            submitStatsGlobal {
                acSubmissionNum {
                    difficulty
                    count
                    submissions
                }
                totalSubmissionNum {
                    difficulty
                    count
                    submissions
                }
            }
            userCalendar(year: $year) {
                submissionCalendar
                streak
                totalActiveDays
            }
        }
        recentAcSubmissionList(username: $username, limit: 10) {
            id
            title
            titleSlug
            timestamp
        }
    }
    """
    
    variables = {"username": username, "year": current_year}
    
    try:
        response = requests.post(
            LEETCODE_GRAPHQL_URL,
            json={"query": query, "variables": variables},
            headers={
                "Content-Type": "application/json",
                "Referer": "https://leetcode.com",
            },
            timeout=15
        )
        
        print(f"LeetCode API status for {username}: {response.status_code}")
        
        if response.status_code != 200:
            print(f"Response: {response.text[:500]}")
            return None
        
        data = response.json()
        
        if "errors" in data:
            print(f"GraphQL errors: {data['errors']}")
            return None
        
        if not data.get("data") or not data["data"].get("matchedUser"):
            print(f"User {username} not found")
            return None
        
        user_data = data["data"]["matchedUser"]
        calendar_info = user_data.get("userCalendar", {})
        recent_problems = data["data"].get("recentAcSubmissionList", [])
        all_questions = data["data"].get("allQuestionsCount", [])
        
        # Parse submission stats
        submission_stats = user_data.get("submitStatsGlobal", {})
        ac_submissions = submission_stats.get("acSubmissionNum", [])
        total_submission_nums = submission_stats.get("totalSubmissionNum", [])
        
        easy_solved = 0
        medium_solved = 0
        hard_solved = 0
        total_solved = 0
        total_accepted_submissions = 0
        
        for item in ac_submissions:
            difficulty = item.get("difficulty", "")
            count = item.get("count", 0)
            submissions = item.get("submissions", 0)
            
            if difficulty == "Easy":
                easy_solved = count
            elif difficulty == "Medium":
                medium_solved = count
            elif difficulty == "Hard":
                hard_solved = count
            elif difficulty == "All":
                total_solved = count
                total_accepted_submissions = submissions
        
        # Get total submissions (including wrong answers)
        total_all_submissions = 0
        for item in total_submission_nums:
            if item.get("difficulty") == "All":
                total_all_submissions = item.get("submissions", 0)
        
        # Acceptance rate = accepted submissions / total submissions (matches LeetCode hover)
        acceptance_rate = 0
        if total_all_submissions > 0:
            acceptance_rate = round((total_accepted_submissions / total_all_submissions) * 100, 2)
        
        print(f"Accepted submissions: {total_accepted_submissions}, Total submissions: {total_all_submissions}")
        
        # Parse submission calendar from userCalendar
        calendar_str = calendar_info.get("submissionCalendar", "{}")
        submission_calendar = json.loads(calendar_str) if calendar_str else {}
        
        print(f"User: {username}, Solved: {total_solved}, Acceptance: {acceptance_rate}%")
        print(f"Calendar entries: {len(submission_calendar)}")
        if len(submission_calendar) > 0:
            sample = list(submission_calendar.items())[:5]
            for ts, count in sample:
                dt = datetime.fromtimestamp(int(ts))
                print(f"  {dt.strftime('%Y-%m-%d')}: {count}")
        
        # Calculate 7-day submissions
        seven_day_submissions = calculate_seven_day_submissions(submission_calendar)
        print(f"7-day: {seven_day_submissions}")
        
        # Today's submissions
        today_submissions = get_today_submissions(submission_calendar)
        print(f"Today: {today_submissions}")
        
        # Format recent problems
        formatted_problems = []
        for problem in recent_problems[:10]:
            submission_id = problem.get("id", "")
            title_slug = problem.get("titleSlug", "")
            formatted_problems.append({
                "title": problem.get("title", ""),
                "titleSlug": title_slug,
                "timestamp": problem.get("timestamp", ""),
                "submissionId": submission_id,
                "url": f"https://leetcode.com/problems/{title_slug}/submissions/{submission_id}/"
            })
        
        return {
            "username": user_data.get("username"),
            "ranking": user_data.get("profile", {}).get("ranking", 0),
            "totalSolved": total_solved,
            "easySolved": easy_solved,
            "mediumSolved": medium_solved,
            "hardSolved": hard_solved,
            "acceptanceRate": acceptance_rate,
            "sevenDaySubmissions": seven_day_submissions,
            "todaySubmissions": today_submissions,
            "recentProblems": formatted_problems
        }
        
    except Exception as e:
        print(f"Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return None

def calculate_seven_day_submissions(calendar):
    """Calculate submissions for the last 7 days"""
    seven_days = []
    today = datetime.now()
    
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        midnight = date.replace(hour=0, minute=0, second=0, microsecond=0)
        
        # Try local midnight timestamp
        local_ts = int(midnight.timestamp())
        count = calendar.get(str(local_ts), 0)
        
        # If not found, try UTC midnight
        if count == 0:
            import calendar as cal
            utc_ts = int(cal.timegm(midnight.timetuple()))
            count = calendar.get(str(utc_ts), 0)
        
        seven_days.append({
            "date": date.strftime("%m/%d"),
            "count": int(count) if count else 0,
            "dayName": date.strftime("%a")
        })
    
    return seven_days

def get_today_submissions(calendar):
    """Get today's submission count"""
    today = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
    
    # Try local midnight
    local_ts = int(today.timestamp())
    count = calendar.get(str(local_ts), 0)
    
    # Try UTC midnight
    if count == 0:
        import calendar as cal
        utc_ts = int(cal.timegm(today.timetuple()))
        count = calendar.get(str(utc_ts), 0)
    
    return int(count) if count else 0

@app.route('/api/user/<username>/detailed', methods=['GET'])
def get_user_detailed_stats(username):
    data = fetch_detailed_leetcode_data(username)
    if data is None:
        return jsonify({"error": "User not found or API error"}), 404
    return jsonify(data)

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({"status": "ok"})

if __name__ == '__main__':
    print("LeetCode Comparison API Server Starting...")
    print(f"Using year: {datetime.now().year}")
    print(f"Server running on http://localhost:5000")
    app.run(debug=True, port=5000, use_reloader=False)
