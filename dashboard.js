// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const AUTO_REFRESH_INTERVAL = 30000;
const DEFAULT_USER1 = 'YYf6XMnK1y';
const DEFAULT_USER2 = 'divsanjog_singh';

let autoRefreshEnabled = true;
let refreshTimer = null;
let countdownTimer = null;
let currentUser1 = '';
let currentUser2 = '';

const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
const manualRefreshBtn = document.getElementById('manual-refresh-btn');
const changeUsersBtn = document.getElementById('change-users-btn');
const refreshTimerDisplay = document.getElementById('refresh-timer');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');
const dashboardContent = document.getElementById('dashboard-content');

document.addEventListener('DOMContentLoaded', () => {
    const urlParams = new URLSearchParams(window.location.search);
    currentUser1 = urlParams.get('user1') || DEFAULT_USER1;
    currentUser2 = urlParams.get('user2') || DEFAULT_USER2;

    setupEventListeners();
    fetchAndDisplay();

    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
});

function setupEventListeners() {
    manualRefreshBtn.addEventListener('click', handleManualRefresh);
    changeUsersBtn.addEventListener('click', () => {
        window.location.href = 'landing.html';
    });
    autoRefreshToggle.addEventListener('change', handleAutoRefreshToggle);
}

async function handleManualRefresh() {
    await fetchAndDisplay();
    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
}

function handleAutoRefreshToggle(e) {
    autoRefreshEnabled = e.target.checked;
    if (autoRefreshEnabled) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

async function fetchAndDisplay() {
    showLoading();
    hideError();

    try {
        const [data1, data2] = await Promise.all([
            fetchDetailedUserData(currentUser1),
            fetchDetailedUserData(currentUser2)
        ]);

        if (data1 && data2) {
            console.log('Data1:', data1);
            console.log('Data2:', data2);
            displayDashboard(data1, data2);
            hideLoading();
        } else {
            throw new Error('Failed to fetch user data');
        }
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to fetch data');
    }
}

async function fetchDetailedUserData(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${username}/detailed`);
        if (!response.ok) {
            if (response.status === 404) {
                throw new Error(`User "${username}" not found`);
            }
            throw new Error(`Failed to fetch data for ${username}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error fetching data for ${username}:`, error);
        throw error;
    }
}

function displayDashboard(data1, data2) {
    updateStreaks(data1, data2);
    update7DayChart(data1, data2);
    updateUserCard('user1', data1);
    updateUserCard('user2', data2);
    updateStatusIndicators(data1, data2);
    updateRecentProblems('user1', data1);
    updateRecentProblems('user2', data2);
    dashboardContent.classList.remove('hidden');
}

function updateStreaks(data1, data2) {
    document.getElementById('user1-name').textContent = data1.username;
    document.getElementById('user1-streak').textContent = data1.todaySubmissions || 0;
    document.getElementById('user2-name').textContent = data2.username;
    document.getElementById('user2-streak').textContent = data2.todaySubmissions || 0;

    const user1StreakCard = document.getElementById('user1-streak-card');
    const user2StreakCard = document.getElementById('user2-streak-card');
    user1StreakCard.classList.remove('winning');
    user2StreakCard.classList.remove('winning');

    if (data1.todaySubmissions > data2.todaySubmissions) {
        user1StreakCard.classList.add('winning');
    } else if (data2.todaySubmissions > data1.todaySubmissions) {
        user2StreakCard.classList.add('winning');
    }
}

function update7DayChart(data1, data2) {
    const canvas = document.getElementById('submissions-chart');
    if (!canvas) {
        console.error('Canvas not found!');
        return;
    }

    const ctx = canvas.getContext('2d');
    canvas.width = 800;
    canvas.height = 300;

    console.log('Canvas size:', canvas.width, 'x', canvas.height);

    const submissions1 = data1.sevenDaySubmissions || [];
    const submissions2 = data2.sevenDaySubmissions || [];

    console.log('Chart data1:', submissions1);
    console.log('Chart data2:', submissions2);

    if (submissions1.length === 0 && submissions2.length === 0) {
        ctx.fillStyle = '#718096';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No submission data available', canvas.width / 2, canvas.height / 2);
        return;
    }

    drawBarChart(ctx, canvas, submissions1, submissions2, data1.username, data2.username);
}

function drawBarChart(ctx, canvas, data1, data2, username1, username2) {
    const padding = 50;
    const chartWidth = canvas.width - padding * 2;
    const chartHeight = canvas.height - padding * 2;

    // Find max value - minimum 5 for visibility
    const maxValue = Math.max(...data1.map(d => d.count), ...data2.map(d => d.count), 5);
    const barWidth = chartWidth / (data1.length * 3);
    const gap = barWidth / 2;

    // Clear canvas with dark background
    ctx.fillStyle = '#0d0d0d';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw grid lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(canvas.width - padding, y);
        ctx.stroke();
    }

    // Draw Y-axis labels
    ctx.fillStyle = '#9e9e9e';
    ctx.font = '11px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * (5 - i));
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(value, padding - 10, y + 4);
    }

    // Draw baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, canvas.height - padding);
    ctx.lineTo(canvas.width - padding, canvas.height - padding);
    ctx.stroke();

    // Draw bars and labels
    data1.forEach((day, index) => {
        const x1 = padding + index * (barWidth * 2 + gap * 2);
        const x2 = x1 + barWidth + gap;

        const height1 = (day.count / maxValue) * chartHeight;
        const height2 = (data2[index].count / maxValue) * chartHeight;

        // User 1 bar - show minimum 4px if data exists
        const displayHeight1 = day.count > 0 ? Math.max(height1, 4) : 0;
        if (displayHeight1 > 0) {
            const gradient1 = ctx.createLinearGradient(0, canvas.height - padding - displayHeight1, 0, canvas.height - padding);
            gradient1.addColorStop(0, '#e91e63');
            gradient1.addColorStop(1, '#c2185b');
            ctx.fillStyle = gradient1;
            ctx.fillRect(x1, canvas.height - padding - displayHeight1, barWidth, displayHeight1);
        }

        // User 2 bar - show minimum 4px if data exists
        const displayHeight2 = data2[index].count > 0 ? Math.max(height2, 4) : 0;
        if (displayHeight2 > 0) {
            const gradient2 = ctx.createLinearGradient(0, canvas.height - padding - displayHeight2, 0, canvas.height - padding);
            gradient2.addColorStop(0, '#00bfa5');
            gradient2.addColorStop(1, '#00897b');
            ctx.fillStyle = gradient2;
            ctx.fillRect(x2, canvas.height - padding - displayHeight2, barWidth, displayHeight2);
        }

        // Draw day labels
        ctx.fillStyle = '#9e9e9e';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(day.dayName, x1 + barWidth + gap / 2, canvas.height - padding + 20);

        // Draw count labels above bars
        if (day.count > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(day.count, x1 + barWidth / 2, canvas.height - padding - displayHeight1 - 5);
        }
        if (data2[index].count > 0) {
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 11px Inter';
            ctx.fillText(data2[index].count, x2 + barWidth / 2, canvas.height - padding - displayHeight2 - 5);
        }
    });

    // Draw legend
    ctx.fillStyle = '#e91e63';
    ctx.fillRect(padding, 15, 15, 15);
    ctx.fillStyle = '#ffffff';
    ctx.font = '13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(username1, padding + 22, 27);

    ctx.fillStyle = '#00bfa5';
    ctx.fillRect(padding + 180, 15, 15, 15);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(username2, padding + 202, 27);

    console.log('Chart drawn successfully');
}

function updateUserCard(prefix, data) {
    document.getElementById(`${prefix}-username`).textContent = data.username;
    document.getElementById(`${prefix}-rank`).textContent = `Rank: ${formatNumber(data.ranking)}`;
    document.getElementById(`${prefix}-total`).textContent = formatNumber(data.totalSolved);
    document.getElementById(`${prefix}-acceptance`).textContent = `${data.acceptanceRate}%`;
    document.getElementById(`${prefix}-ranking`).textContent = formatNumber(data.ranking);
    document.getElementById(`${prefix}-easy`).textContent = formatNumber(data.easySolved);
    document.getElementById(`${prefix}-medium`).textContent = formatNumber(data.mediumSolved);
    document.getElementById(`${prefix}-hard`).textContent = formatNumber(data.hardSolved);

    const maxSolved = Math.max(data.easySolved, data.mediumSolved, data.hardSolved, 1);
    document.getElementById(`${prefix}-easy-bar`).style.width = `${(data.easySolved / maxSolved) * 100}%`;
    document.getElementById(`${prefix}-medium-bar`).style.width = `${(data.mediumSolved / maxSolved) * 100}%`;
    document.getElementById(`${prefix}-hard-bar`).style.width = `${(data.hardSolved / maxSolved) * 100}%`;
}

function updateStatusIndicators(data1, data2) {
    const user1Status = document.getElementById('user1-status');
    const user2Status = document.getElementById('user2-status');
    const user1Card = document.getElementById('user1-card');
    const user2Card = document.getElementById('user2-card');

    user1Status.className = 'status-indicator';
    user2Status.className = 'status-indicator';
    user1Card.classList.remove('winning');
    user2Card.classList.remove('winning');

    const diff = data1.totalSolved - data2.totalSolved;

    if (diff > 0) {
        user1Status.classList.add('leading');
        user1Status.textContent = `+${diff} ahead`;
        user2Status.classList.add('trailing');
        user2Status.textContent = `${Math.abs(diff)} behind`;
        user1Card.classList.add('winning');
    } else if (diff < 0) {
        user2Status.classList.add('leading');
        user2Status.textContent = `+${Math.abs(diff)} ahead`;
        user1Status.classList.add('trailing');
        user1Status.textContent = `${Math.abs(diff)} behind`;
        user2Card.classList.add('winning');
    } else {
        user1Status.classList.add('tied');
        user1Status.textContent = 'Tied';
        user2Status.classList.add('tied');
        user2Status.textContent = 'Tied';
    }
}

function updateRecentProblems(prefix, data) {
    const problemsList = document.getElementById(`${prefix}-problems`);
    const problemsTitle = document.getElementById(`${prefix}-problems-title`);
    problemsTitle.textContent = data.username;

    if (!data.recentProblems || data.recentProblems.length === 0) {
        problemsList.innerHTML = '<div class="empty-problems">No recent problems</div>';
        return;
    }

    problemsList.innerHTML = data.recentProblems.map(problem => `
        <div class="problem-item" onclick="window.open('${problem.url}', '_blank')">
            <div class="problem-title">
                ${escapeHtml(problem.title)}
                <span class="problem-link-icon">🔗</span>
            </div>
            <div class="problem-time">${getTimeAgo(problem.timestamp)}</div>
        </div>
    `).join('');
}

function getTimeAgo(timestamp) {
    const now = Date.now() / 1000;
    const diff = now - parseInt(timestamp);
    if (diff < 3600) {
        const minutes = Math.floor(diff / 60);
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (diff < 86400) {
        const hours = Math.floor(diff / 3600);
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else {
        const days = Math.floor(diff / 86400);
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function startAutoRefresh() {
    stopAutoRefresh();
    let secondsRemaining = AUTO_REFRESH_INTERVAL / 1000;
    const updateCountdown = () => {
        if (secondsRemaining > 0) {
            refreshTimerDisplay.textContent = `Next refresh in ${secondsRemaining}s`;
            secondsRemaining--;
        }
    };
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);
    refreshTimer = setTimeout(async () => {
        await fetchAndDisplay();
        if (autoRefreshEnabled) {
            startAutoRefresh();
        }
    }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    if (countdownTimer) clearInterval(countdownTimer);
    refreshTimerDisplay.textContent = '';
}

function showLoading() {
    loadingElement.classList.remove('hidden');
    dashboardContent.classList.add('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => errorElement.classList.add('hidden'), 5000);
}

function hideError() {
    errorElement.classList.add('hidden');
}

function formatNumber(num) {
    if (num === 0 || num === null || num === undefined) return '0';
    return num.toLocaleString();
}

window.addEventListener('beforeunload', stopAutoRefresh);

