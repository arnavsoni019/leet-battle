const LEETCODE_GRAPHQL_URL = 'https://leetcode.com/graphql/';

const QUERY = `
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
`;

function calculateSevenDaySubmissions(calendar) {
    const result = [];
    const now = new Date();

    for (let i = 6; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        date.setHours(0, 0, 0, 0);

        const localTs = Math.floor(date.getTime() / 1000);
        let count = calendar[String(localTs)] || 0;

        if (!count) {
            const utcTs = Math.floor(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 1000);
            count = calendar[String(utcTs)] || 0;
        }

        result.push({
            date: `${String(date.getMonth() + 1).padStart(2, '0')}/${String(date.getDate()).padStart(2, '0')}`,
            count: Number(count) || 0,
            dayName: date.toLocaleDateString('en-US', { weekday: 'short' })
        });
    }

    return result;
}

function getTodaySubmissions(calendar) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const localTs = Math.floor(today.getTime() / 1000);
    let count = calendar[String(localTs)] || 0;

    if (!count) {
        const utcTs = Math.floor(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()) / 1000);
        count = calendar[String(utcTs)] || 0;
    }

    return Number(count) || 0;
}

export default async (req, context) => {
    const { username } = context.params;
    const currentYear = new Date().getFullYear();

    let lcResponse;
    try {
        lcResponse = await fetch(LEETCODE_GRAPHQL_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Referer': 'https://leetcode.com',
            },
            body: JSON.stringify({
                query: QUERY,
                variables: { username, year: currentYear }
            })
        });
    } catch {
        return Response.json({ error: 'Failed to reach LeetCode API' }, { status: 502 });
    }

    if (!lcResponse.ok) {
        return Response.json({ error: 'LeetCode API error' }, { status: 502 });
    }

    const data = await lcResponse.json();

    if (data.errors || !data.data?.matchedUser) {
        return Response.json({ error: `User "${username}" not found` }, { status: 404 });
    }

    const userData = data.data.matchedUser;
    const calendarInfo = userData.userCalendar || {};
    const recentProblems = data.data.recentAcSubmissionList || [];

    const acSubmissions = userData.submitStatsGlobal?.acSubmissionNum || [];
    const totalSubmissionNums = userData.submitStatsGlobal?.totalSubmissionNum || [];

    let easySolved = 0, mediumSolved = 0, hardSolved = 0, totalSolved = 0;
    let totalAcceptedSubmissions = 0;

    for (const item of acSubmissions) {
        if (item.difficulty === 'Easy') easySolved = item.count;
        else if (item.difficulty === 'Medium') mediumSolved = item.count;
        else if (item.difficulty === 'Hard') hardSolved = item.count;
        else if (item.difficulty === 'All') {
            totalSolved = item.count;
            totalAcceptedSubmissions = item.submissions;
        }
    }

    let totalAllSubmissions = 0;
    for (const item of totalSubmissionNums) {
        if (item.difficulty === 'All') totalAllSubmissions = item.submissions;
    }

    const acceptanceRate = totalAllSubmissions > 0
        ? Math.round((totalAcceptedSubmissions / totalAllSubmissions) * 10000) / 100
        : 0;

    const calendarStr = calendarInfo.submissionCalendar || '{}';
    const submissionCalendar = JSON.parse(calendarStr);

    const sevenDaySubmissions = calculateSevenDaySubmissions(submissionCalendar);
    const todaySubmissions = getTodaySubmissions(submissionCalendar);

    const formattedProblems = recentProblems.slice(0, 10).map(problem => ({
        title: problem.title,
        titleSlug: problem.titleSlug,
        timestamp: problem.timestamp,
        submissionId: problem.id,
        url: `https://leetcode.com/problems/${problem.titleSlug}/submissions/${problem.id}/`
    }));

    return Response.json({
        username: userData.username,
        ranking: userData.profile?.ranking || 0,
        totalSolved,
        easySolved,
        mediumSolved,
        hardSolved,
        acceptanceRate,
        sevenDaySubmissions,
        todaySubmissions,
        recentProblems: formattedProblems
    });
};

export const config = {
    path: '/api/user/:username/detailed'
};
