const LEETCODE_GQL = 'https://leetcode.com/graphql'

const QUERY = `
query getUserData($username: String!, $year: Int) {
  matchedUser(username: $username) {
    username
    submitStats: submitStatsGlobal {
      acSubmissionNum {
        difficulty
        count
        submissions
      }
    }
    profile {
      ranking
    }
    userCalendar(year: $year) {
      submissionCalendar
    }
  }
  recentAcSubmissionList(username: $username, limit: 10) {
    id
    title
    titleSlug
    timestamp
  }
}
`

function getSevenDaySubmissions(calendarJson) {
  const calendar = JSON.parse(calendarJson || '{}')
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const result = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setUTCHours(0, 0, 0, 0)
    d.setUTCDate(d.getUTCDate() - i)
    const ts = Math.floor(d.getTime() / 1000)
    result.push({ dayName: dayNames[d.getUTCDay()], count: calendar[ts] || 0 })
  }
  return result
}

export default async (req, context) => {
  const { username } = context.params

  try {
    const year = new Date().getUTCFullYear()
    const res = await fetch(LEETCODE_GQL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Referer': 'https://leetcode.com',
        'User-Agent': 'Mozilla/5.0 (compatible; LeetBattle/1.0)',
      },
      body: JSON.stringify({ query: QUERY, variables: { username, year } }),
    })

    if (!res.ok) {
      return Response.json({ error: 'LeetCode API unavailable' }, { status: 502 })
    }

    const { data, errors } = await res.json()

    if (errors?.length || !data?.matchedUser) {
      return Response.json({ error: `User "${username}" not found` }, { status: 404 })
    }

    const user = data.matchedUser
    const acStats = user.submitStats.acSubmissionNum

    const get = (diff) => acStats.find(s => s.difficulty === diff) || { count: 0, submissions: 0 }
    const all = get('All')
    const easy = get('Easy')
    const medium = get('Medium')
    const hard = get('Hard')

    const acceptanceRate = all.submissions > 0
      ? ((all.count / all.submissions) * 100).toFixed(1)
      : '0.0'

    const sevenDaySubmissions = getSevenDaySubmissions(user.userCalendar?.submissionCalendar)
    const todaySubmissions = sevenDaySubmissions.at(-1)?.count || 0

    const recentProblems = (data.recentAcSubmissionList || []).map(p => ({
      title: p.title,
      url: `https://leetcode.com/problems/${p.titleSlug}/`,
      timestamp: p.timestamp,
    }))

    return Response.json({
      username: user.username,
      totalSolved: all.count,
      easySolved: easy.count,
      mediumSolved: medium.count,
      hardSolved: hard.count,
      ranking: user.profile.ranking || 0,
      acceptanceRate,
      todaySubmissions,
      sevenDaySubmissions,
      recentProblems,
    })
  } catch (err) {
    console.error('Error fetching LeetCode data for', username, err)
    return Response.json({ error: 'Failed to fetch user data' }, { status: 500 })
  }
}

export const config = {
  path: '/api/user/:username/detailed',
}
