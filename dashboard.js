// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const AUTO_REFRESH_INTERVAL = 120000; // 2 minutes

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
    currentUser1 = urlParams.get('user1');
    currentUser2 = urlParams.get('user2');

    // Redirect to landing page if no usernames provided
    if (!currentUser1 || !currentUser2) {
        window.location.href = 'index.html';
        return;
    }

    setupEventListeners();
    fetchAndDisplay();

    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
});

function setupEventListeners() {
    manualRefreshBtn.addEventListener('click', handleManualRefresh);
    changeUsersBtn.addEventListener('click', () => {
        window.location.href = 'index.html';
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
    dashboardContent.classList.remove('hidden');
    updateStreaks(data1, data2);
    update7DayChart(data1, data2);
    updateUserCard('user1', data1);
    updateUserCard('user2', data2);
    updateStatusIndicators(data1, data2);
    updateRecentProblems('user1', data1);
    updateRecentProblems('user2', data2);
}

// Animate a number from its current displayed value up/down to a target.
function animateValue(el, end, { suffix = '', duration = 900 } = {}) {
    if (!el) return;
    end = Number(end) || 0;
    const start = parseInt((el.textContent || '0').replace(/[^0-9-]/g, ''), 10) || 0;
    if (start === end) { el.textContent = formatNumber(end) + suffix; return; }
    const t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    function frame(now) {
        const p = Math.min((now - t0) / duration, 1);
        const val = Math.round(start + (end - start) * ease(p));
        el.textContent = formatNumber(val) + suffix;
        if (p < 1) requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
}

function updateStreaks(data1, data2) {
    document.getElementById('user1-name').textContent = data1.username;
    document.getElementById('user2-name').textContent = data2.username;
    animateValue(document.getElementById('user1-streak'), data1.todaySubmissions || 0);
    animateValue(document.getElementById('user2-streak'), data2.todaySubmissions || 0);

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

    const container = canvas.parentElement;
    const rect = container.getBoundingClientRect();
    const logicalWidth = rect.width || 800;
    const logicalHeight = rect.height || 300;
    
    const dpr = window.devicePixelRatio || 1;
    
    // Set actual size in memory (scaled to account for extra pixel density)
    canvas.width = logicalWidth * dpr;
    canvas.height = logicalHeight * dpr;
    
    // Normalize coordinate system to use CSS pixels
    canvas.style.width = '100%';
    canvas.style.height = '100%';

    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);

    console.log('Canvas logical size:', logicalWidth, 'x', logicalHeight, 'DPR:', dpr);

    const submissions1 = data1.sevenDaySubmissions || [];
    const submissions2 = data2.sevenDaySubmissions || [];

    if (submissions1.length === 0 && submissions2.length === 0) {
        ctx.fillStyle = '#718096';
        ctx.font = '16px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('No submission data available', logicalWidth / 2, logicalHeight / 2);
        return;
    }

    drawBarChart(ctx, logicalWidth, logicalHeight, submissions1, submissions2, data1.username, data2.username);
}

function drawBarChart(ctx, logicalWidth, logicalHeight, data1, data2, username1, username2) {
    const padding = 60;
    const chartWidth = logicalWidth - padding * 2;
    const chartHeight = logicalHeight - padding * 2;

    // Find max value - minimum 5 for visibility
    const maxValue = Math.max(...data1.map(d => d.count), ...data2.map(d => d.count), 5);
    const barWidth = Math.min((chartWidth / (data1.length * 3)) * 1.2, 30);
    const gap = barWidth * 0.5;

    // Clear canvas instead of using a solid block to let CSS styles through
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    // Draw grid lines as dotted lines
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    for (let i = 0; i <= 5; i++) {
        const y = padding + (chartHeight / 5) * i;
        ctx.beginPath();
        ctx.moveTo(padding, y);
        ctx.lineTo(logicalWidth - padding, y);
        ctx.stroke();
    }
    ctx.setLineDash([]); // reset

    // Draw Y-axis labels
    ctx.fillStyle = '#9e9e9e';
    ctx.font = '500 12px Inter';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = Math.round((maxValue / 5) * (5 - i));
        const y = padding + (chartHeight / 5) * i;
        ctx.fillText(value, padding - 15, y + 4);
    }

    // Draw baseline
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(padding, logicalHeight - padding);
    ctx.lineTo(logicalWidth - padding, logicalHeight - padding);
    ctx.stroke();

    const blockWidth = (barWidth * 2) + (gap * 2);
    const totalContentWidth = data1.length * blockWidth;
    const startX = padding + (chartWidth - totalContentWidth) / 2;

    // Draw bars and labels
    data1.forEach((day, index) => {
        const x1 = startX + index * blockWidth;
        const x2 = x1 + barWidth + gap / 2;

        const height1 = (day.count / maxValue) * chartHeight;
        const height2 = (data2[index].count / maxValue) * chartHeight;

        // Minimum 6px height if data exists
        const displayHeight1 = day.count > 0 ? Math.max(height1, 6) : 0;
        const displayHeight2 = data2[index].count > 0 ? Math.max(height2, 6) : 0;

        // Draw background tracks for bars
        ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
        ctx.beginPath();
        ctx.roundRect(x1, padding, barWidth, chartHeight, [4, 4, 0, 0]);
        ctx.fill();

        ctx.beginPath();
        ctx.roundRect(x2, padding, barWidth, chartHeight, [4, 4, 0, 0]);
        ctx.fill();

        // User 1 bar with shadow
        if (displayHeight1 > 0) {
            ctx.shadowColor = 'rgba(45, 212, 255, 0.5)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;

            const gradient1 = ctx.createLinearGradient(0, logicalHeight - padding - displayHeight1, 0, logicalHeight - padding);
            gradient1.addColorStop(0, '#7af0ff');
            gradient1.addColorStop(1, '#2dd4ff');
            ctx.fillStyle = gradient1;
            
            ctx.beginPath();
            ctx.roundRect(x1, logicalHeight - padding - displayHeight1, barWidth, displayHeight1, [6, 6, 0, 0]);
            ctx.fill();
            
            // reset shadow for text
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;
            
            // Draw count label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(day.count, x1 + barWidth / 2, logicalHeight - padding - displayHeight1 - 10);
        }

        // User 2 bar with shadow
        if (displayHeight2 > 0) {
            ctx.shadowColor = 'rgba(255, 176, 32, 0.5)';
            ctx.shadowBlur = 12;
            ctx.shadowOffsetY = 4;

            const gradient2 = ctx.createLinearGradient(0, logicalHeight - padding - displayHeight2, 0, logicalHeight - padding);
            gradient2.addColorStop(0, '#ffd07a');
            gradient2.addColorStop(1, '#ffb020');
            ctx.fillStyle = gradient2;
            
            ctx.beginPath();
            ctx.roundRect(x2, logicalHeight - padding - displayHeight2, barWidth, displayHeight2, [6, 6, 0, 0]);
            ctx.fill();
            
            // reset shadow for text
            ctx.shadowColor = 'transparent';
            ctx.shadowBlur = 0;

            // Draw count label
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 12px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(data2[index].count, x2 + barWidth / 2, logicalHeight - padding - displayHeight2 - 10);
        }

        // Draw day labels
        ctx.fillStyle = '#a0aec0';
        ctx.font = '500 13px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(day.dayName, x1 + barWidth + gap / 4, logicalHeight - padding + 25);
    });

    // Draw modern legend
    const legendY = 25;
    
    // User 1 Legend
    ctx.shadowColor = 'rgba(45, 212, 255, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#2dd4ff';
    ctx.beginPath();
    ctx.arc(padding + 20, legendY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e0e0e0';
    ctx.font = '600 13px Inter';
    ctx.textAlign = 'left';
    ctx.fillText(username1, padding + 35, legendY + 4);

    // User 2 Legend
    const user2LegendX = padding + 150 + ctx.measureText(username1).width;
    ctx.shadowColor = 'rgba(255, 176, 32, 0.5)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ffb020';
    ctx.beginPath();
    ctx.arc(user2LegendX, legendY, 6, 0, 2 * Math.PI);
    ctx.fill();
    
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.fillStyle = '#e0e0e0';
    ctx.fillText(username2, user2LegendX + 15, legendY + 4);

    console.log('Chart drawn successfully');
}

function updateUserCard(prefix, data) {
    document.getElementById(`${prefix}-username`).textContent = data.username;
    document.getElementById(`${prefix}-rank`).textContent = `Rank: ${formatNumber(data.ranking)}`;
    document.getElementById(`${prefix}-acceptance`).textContent = `${data.acceptanceRate}%`;
    animateValue(document.getElementById(`${prefix}-total`), data.totalSolved);
    animateValue(document.getElementById(`${prefix}-ranking`), data.ranking);
    animateValue(document.getElementById(`${prefix}-easy`), data.easySolved);
    animateValue(document.getElementById(`${prefix}-medium`), data.mediumSolved);
    animateValue(document.getElementById(`${prefix}-hard`), data.hardSolved);

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

