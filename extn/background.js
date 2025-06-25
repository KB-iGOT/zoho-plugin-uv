// Background script for Zoho Ticket API Invoker
let capturedCookies = '';

chrome.runtime.onInstalled.addListener(() => {
    console.log('Zoho Ticket API Invoker extension installed');
    setupCookieInterception();
});

// Capture cookies from network requests
function setupCookieInterception() {
    chrome.webRequest.onBeforeSendHeaders.addListener(
        function(details) {
            if (details.requestHeaders) {
                for (let header of details.requestHeaders) {
                    if (header.name.toLowerCase() === 'cookie') {
                        const cookieValue = header.value;

                        // Only update if we get a substantial cookie string
                        if (cookieValue && cookieValue.length > 100) {
                            capturedCookies = cookieValue;
                            console.log('🍪 Captured cookies:', cookieValue.length, 'chars');

                            // Store for persistence
                            chrome.storage.local.set({
                                networkCapturedCookies: cookieValue,
                                lastUpdate: Date.now()
                            });
                        }
                        break;
                    }
                }
            }
            return {requestHeaders: details.requestHeaders};
        },
        {
            urls: ["https://desk.zoho.in/*", "https://*.zoho.in/*", "https://zoho.in/*"]
        },
        ["requestHeaders"]
    );
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'makeAPICall') {
        handleAPICall(request, sendResponse);
        return true;
    }
});

// Make API call with captured cookies
async function handleAPICall(request, sendResponse) {
    try {
        // Get best available cookies
        let cookieString = await getBestCookieString();

        if (!cookieString || cookieString.length < 50) {
            throw new Error('No valid cookies found. Please refresh the Zoho page and try again.');
        }

        console.log('Using cookies length:', cookieString.length);
        console.log('Cookie preview:', cookieString.substring(0, 100) + '...');

        const response = await fetch(request.apiUrl, {
            method: 'GET',
            headers: {
                'accept': 'application/json',
                'X-Zoho-Cookies': cookieString,
                'X-Extension-Request': 'true'
            }
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();
        sendResponse({ success: true, data: data });

    } catch (error) {
        console.error('API call failed:', error);
        sendResponse({
            success: false,
            error: error.message
        });
    }
}

// Get the best available cookie string
async function getBestCookieString() {
    // First try captured cookies from network requests
    if (capturedCookies && capturedCookies.length > 100) {
        return capturedCookies;
    }

    // Try stored cookies from previous captures
    try {
        const result = await chrome.storage.local.get(['networkCapturedCookies']);
        if (result.networkCapturedCookies && result.networkCapturedCookies.length > 100) {
            capturedCookies = result.networkCapturedCookies;
            return result.networkCapturedCookies;
        }
    } catch (error) {
        console.warn('Failed to get stored cookies:', error);
    }

    // Fallback to Chrome cookie API
    try {
        const chromeCookies = await getChromeAPICookies();
        if (chromeCookies && chromeCookies.length > 50) {
            return chromeCookies;
        }
    } catch (error) {
        console.warn('Failed to get Chrome API cookies:', error);
    }

    return '';
}

// Enhanced Chrome API cookie retrieval
function getChromeAPICookies() {
    return new Promise((resolve) => {
        // Get cookies from multiple Zoho domains
        const domains = ['desk.zoho.in', '.zoho.in', 'zoho.in'];
        let allCookies = [];
        let pendingRequests = domains.length;

        domains.forEach(domain => {
            chrome.cookies.getAll({domain: domain}, (cookies) => {
                if (cookies && cookies.length > 0) {
                    allCookies = allCookies.concat(cookies);
                }

                pendingRequests--;
                if (pendingRequests === 0) {
                    // Remove duplicates based on cookie name
                    const uniqueCookies = [];
                    const seenNames = new Set();

                    allCookies.forEach(cookie => {
                        if (!seenNames.has(cookie.name)) {
                            uniqueCookies.push(cookie);
                            seenNames.add(cookie.name);
                        }
                    });

                    const cookieString = uniqueCookies
                        .map(c => `${c.name}=${c.value}`)
                        .join('; ');

                    console.log('Chrome API cookies count:', uniqueCookies.length);
                    console.log('Chrome API cookie string length:', cookieString.length);

                    resolve(cookieString);
                }
            });
        });
    });
}