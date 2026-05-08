import requests
import json
from datetime import datetime

url = "https://leetcode.com/graphql/"

# Test 1: submissionCalendar directly under matchedUser (original)
print("=== TEST 1: submissionCalendar under matchedUser ===")
query1 = """
query getUserProfile($username: String!) {
    matchedUser(username: $username) {
        username
        submissionCalendar
    }
}
"""
resp = requests.post(url, json={"query": query1, "variables": {"username": "YYf6XMnK1y"}},
    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"}, timeout=15)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    if "errors" in data:
        print(f"Errors: {data['errors']}")
    else:
        cal = data.get("data", {}).get("matchedUser", {}).get("submissionCalendar", "MISSING")
        if cal and cal != "MISSING":
            parsed = json.loads(cal)
            print(f"Calendar entries: {len(parsed)}")
            if len(parsed) > 0:
                for ts, count in list(parsed.items())[:5]:
                    dt = datetime.fromtimestamp(int(ts))
                    print(f"  {dt.strftime('%Y-%m-%d')}: {count}")
        else:
            print(f"Calendar value: {cal}")
else:
    print(f"Response: {resp.text[:300]}")

# Test 2: userCalendar under matchedUser
print("\n=== TEST 2: userCalendar under matchedUser ===")
query2 = """
query getUserProfile($username: String!) {
    matchedUser(username: $username) {
        username
        userCalendar {
            submissionCalendar
            streak
            totalActiveDays
        }
    }
}
"""
resp = requests.post(url, json={"query": query2, "variables": {"username": "YYf6XMnK1y"}},
    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"}, timeout=15)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    if "errors" in data:
        print(f"Errors: {data['errors']}")
    else:
        uc = data.get("data", {}).get("matchedUser", {}).get("userCalendar", {})
        cal = uc.get("submissionCalendar", "MISSING") if uc else "MISSING"
        if cal and cal != "MISSING":
            parsed = json.loads(cal)
            print(f"Calendar entries: {len(parsed)}")
            if len(parsed) > 0:
                for ts, count in list(parsed.items())[:5]:
                    dt = datetime.fromtimestamp(int(ts))
                    print(f"  {dt.strftime('%Y-%m-%d')}: {count}")
        else:
            print(f"Calendar value: {cal}")
else:
    print(f"Response: {resp.text[:300]}")

# Test 3: userCalendar with year param under matchedUser
print("\n=== TEST 3: userCalendar(year) under matchedUser ===")
query3 = """
query getUserProfile($username: String!, $year: Int) {
    matchedUser(username: $username) {
        username
        userCalendar(year: $year) {
            submissionCalendar
            streak
            totalActiveDays
        }
    }
}
"""
resp = requests.post(url, json={"query": query3, "variables": {"username": "YYf6XMnK1y", "year": 2026}},
    headers={"Content-Type": "application/json", "Referer": "https://leetcode.com"}, timeout=15)
print(f"Status: {resp.status_code}")
if resp.status_code == 200:
    data = resp.json()
    if "errors" in data:
        print(f"Errors: {data['errors']}")
    else:
        uc = data.get("data", {}).get("matchedUser", {}).get("userCalendar", {})
        cal = uc.get("submissionCalendar", "MISSING") if uc else "MISSING"
        if cal and cal != "MISSING":
            parsed = json.loads(cal)
            print(f"Calendar entries: {len(parsed)}")
            if len(parsed) > 0:
                for ts, count in list(parsed.items())[:5]:
                    dt = datetime.fromtimestamp(int(ts))
                    print(f"  {dt.strftime('%Y-%m-%d')}: {count}")
        else:
            print(f"Calendar value: {cal}")
else:
    print(f"Response: {resp.text[:300]}")
