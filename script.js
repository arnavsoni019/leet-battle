// Configuration
const API_BASE_URL = 'http://localhost:5000/api';
const AUTO_REFRESH_INTERVAL = 30000; // 30 seconds
const STORAGE_KEY_USER1 = 'leetcode_user1';
const STORAGE_KEY_USER2 = 'leetcode_user2';

// State
let autoRefreshEnabled = true;
let refreshTimer = null;
let countdownTimer = null;
let currentUser1 = '';
let currentUser2 = '';

// DOM Elements
const user1Input = document.getElementById('user1-input');
const user2Input = document.getElementById('user2-input');
const compareBtn = document.getElementById('compare-btn');
const autoRefreshToggle = document.getElementById('auto-refresh-toggle');
const manualRefreshBtn = document.getElementById('manual-refresh-btn');
const refreshTimerDisplay = document.getElementById('refresh-timer');
const loadingElement = document.getElementById('loading');
const errorElement = document.getElementById('error-message');
const comparisonContainer = document.getElementById('comparison-container');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadSavedUsernames();
    setupEventListeners();
});

function setupEventListeners() {
    compareBtn.addEventListener('click', handleCompare);
    manualRefreshBtn.addEventListener('click', handleManualRefresh);
    autoRefreshToggle.addEventListener('change', handleAutoRefreshToggle);

    // Allow Enter key to trigger comparison
    user1Input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCompare();
    });
    user2Input.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') handleCompare();
    });
}

function loadSavedUsernames() {
    const savedUser1 = localStorage.getItem(STORAGE_KEY_USER1);
    const savedUser2 = localStorage.getItem(STORAGE_KEY_USER2);

    if (savedUser1) user1Input.value = savedUser1;
    if (savedUser2) user2Input.value = savedUser2;

    // Auto-load if both usernames are saved
    if (savedUser1 && savedUser2) {
        setTimeout(() => handleCompare(), 500);
    }
}

function saveUsernames(user1, user2) {
    localStorage.setItem(STORAGE_KEY_USER1, user1);
    localStorage.setItem(STORAGE_KEY_USER2, user2);
}

async function handleCompare() {
    const username1 = user1Input.value.trim();
    const username2 = user2Input.value.trim();

    if (!username1 || !username2) {
        showError('Please enter both usernames');
        return;
    }

    currentUser1 = username1;
    currentUser2 = username2;

    saveUsernames(username1, username2);
    await fetchAndCompare();

    // Start auto-refresh if enabled
    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
}

async function handleManualRefresh() {
    if (!currentUser1 || !currentUser2) {
        showError('Please compare profiles first');
        return;
    }

    await fetchAndCompare();

    // Restart auto-refresh timer
    if (autoRefreshEnabled) {
        startAutoRefresh();
    }
}

function handleAutoRefreshToggle(e) {
    autoRefreshEnabled = e.target.checked;

    if (autoRefreshEnabled && currentUser1 && currentUser2) {
        startAutoRefresh();
    } else {
        stopAutoRefresh();
    }
}

async function fetchAndCompare() {
    showLoading();
    hideError();

    try {
        const [data1, data2] = await Promise.all([
            fetchUserData(currentUser1),
            fetchUserData(currentUser2)
        ]);

        if (data1 && data2) {
            displayComparison(data1, data2);
            hideLoading();
        } else {
            throw new Error('Failed to fetch user data');
        }
    } catch (error) {
        hideLoading();
        showError(error.message || 'Failed to fetch data. Please check usernames and try again.');
    }
}

async function fetchUserData(username) {
    try {
        const response = await fetch(`${API_BASE_URL}/user/${username}`);

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

function displayComparison(data1, data2) {
    // Update user 1 card
    updateUserCard('user1', data1);

    // Update user 2 card
    updateUserCard('user2', data2);

    // Update status indicators
    updateStatusIndicators(data1, data2);

    // Show comparison container
    comparisonContainer.classList.remove('hidden');
}

function updateUserCard(prefix, data) {
    // Update username and rank
    document.getElementById(`${prefix}-username`).textContent = data.username;
    document.getElementById(`${prefix}-rank`).textContent = `Rank: ${formatNumber(data.ranking)}`;

    // Update stats
    document.getElementById(`${prefix}-total`).textContent = formatNumber(data.totalSolved);
    document.getElementById(`${prefix}-acceptance`).textContent = `${data.acceptanceRate}%`;
    document.getElementById(`${prefix}-recent`).textContent = formatNumber(data.recentAccepted);
    document.getElementById(`${prefix}-reputation`).textContent = formatNumber(data.reputation);

    // Update difficulty counts
    document.getElementById(`${prefix}-easy`).textContent = formatNumber(data.easySolved);
    document.getElementById(`${prefix}-medium`).textContent = formatNumber(data.mediumSolved);
    document.getElementById(`${prefix}-hard`).textContent = formatNumber(data.hardSolved);

    // Update progress bars (as percentage of total solved)
    const maxSolved = Math.max(data.easySolved, data.mediumSolved, data.hardSolved, 1);
    const easyPercent = (data.easySolved / maxSolved) * 100;
    const mediumPercent = (data.mediumSolved / maxSolved) * 100;
    const hardPercent = (data.hardSolved / maxSolved) * 100;

    document.getElementById(`${prefix}-easy-bar`).style.width = `${easyPercent}%`;
    document.getElementById(`${prefix}-medium-bar`).style.width = `${mediumPercent}%`;
    document.getElementById(`${prefix}-hard-bar`).style.width = `${hardPercent}%`;
}

function updateStatusIndicators(data1, data2) {
    const user1Status = document.getElementById('user1-status');
    const user2Status = document.getElementById('user2-status');
    const user1Card = document.getElementById('user1-card');
    const user2Card = document.getElementById('user2-card');

    // Clear previous classes
    user1Status.className = 'status-indicator';
    user2Status.className = 'status-indicator';
    user1Card.classList.remove('winning');
    user2Card.classList.remove('winning');

    const diff = data1.totalSolved - data2.totalSolved;

    if (diff > 0) {
        // User 1 is leading
        user1Status.classList.add('leading');
        user1Status.textContent = `+${diff} ahead`;
        user2Status.classList.add('trailing');
        user2Status.textContent = `${Math.abs(diff)} behind`;
        user1Card.classList.add('winning');
    } else if (diff < 0) {
        // User 2 is leading
        user2Status.classList.add('leading');
        user2Status.textContent = `+${Math.abs(diff)} ahead`;
        user1Status.classList.add('trailing');
        user1Status.textContent = `${Math.abs(diff)} behind`;
        user2Card.classList.add('winning');
    } else {
        // Tied
        user1Status.classList.add('tied');
        user1Status.textContent = 'Tied';
        user2Status.classList.add('tied');
        user2Status.textContent = 'Tied';
    }
}

function startAutoRefresh() {
    stopAutoRefresh(); // Clear any existing timers

    let secondsRemaining = AUTO_REFRESH_INTERVAL / 1000;

    // Update countdown display
    const updateCountdown = () => {
        if (secondsRemaining > 0) {
            refreshTimerDisplay.textContent = `Next refresh in ${secondsRemaining}s`;
            secondsRemaining--;
        }
    };

    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 1000);

    // Set refresh timer
    refreshTimer = setTimeout(async () => {
        await fetchAndCompare();
        if (autoRefreshEnabled) {
            startAutoRefresh(); // Restart the cycle
        }
    }, AUTO_REFRESH_INTERVAL);
}

function stopAutoRefresh() {
    if (refreshTimer) {
        clearTimeout(refreshTimer);
        refreshTimer = null;
    }
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    refreshTimerDisplay.textContent = '';
}

function showLoading() {
    loadingElement.classList.remove('hidden');
    comparisonContainer.classList.add('hidden');
}

function hideLoading() {
    loadingElement.classList.add('hidden');
}

function showError(message) {
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => {
        errorElement.classList.add('hidden');
    }, 5000);
}

function hideError() {
    errorElement.classList.add('hidden');
}

function formatNumber(num) {
    if (num === 0 || num === null || num === undefined) return '0';
    return num.toLocaleString();
}

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    stopAutoRefresh();
});
