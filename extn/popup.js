// Popup script for Zoho Ticket API Invoker
document.addEventListener('DOMContentLoaded', function() {
    const currentTicketDiv = document.getElementById('currentTicket');
    const apiEndpointInput = document.getElementById('apiEndpoint');
    const apiKeyInput = document.getElementById('apiKey');
    const testApiButton = document.getElementById('testApi');
    const invokeApiButton = document.getElementById('invokeApi');
    const statusDiv = document.getElementById('status');

    let currentTicketId = null;

    // Load saved configuration
    chrome.storage.sync.get(['apiEndpoint', 'apiKey'], function(result) {
        apiEndpointInput.value = result.apiEndpoint || 'https://support.uat.karmayogibharat.net/zoho_plugin/ticket/details';
        apiKeyInput.value = result.apiKey || '';
    });

    // Save configuration when changed
    apiEndpointInput.addEventListener('change', function() {
        chrome.storage.sync.set({ apiEndpoint: apiEndpointInput.value });
    });

    apiKeyInput.addEventListener('change', function() {
        chrome.storage.sync.set({ apiKey: apiKeyInput.value });
    });

    // Get current tab information
    chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
        const tab = tabs[0];
        if (tab.url && tab.url.includes('desk.zoho.in') && tab.url.includes('tickets/details/')) {
            const match = tab.url.match(/tickets\/details\/(\d+)/);
            if (match) {
                currentTicketId = match[1];
                currentTicketDiv.textContent = `Ticket ID: ${currentTicketId}`;
                invokeApiButton.disabled = false;
            }
        }
    });

    // Test API connection
    testApiButton.addEventListener('click', async function() {
        const endpoint = apiEndpointInput.value;
        if (!endpoint) {
            showStatus('Please enter API endpoint', 'error');
            return;
        }

        testApiButton.disabled = true;
        testApiButton.textContent = 'Testing...';

        try {
            const testUrl = `${endpoint}/120349000058009045`;
            const response = await fetch(testUrl, {
                method: 'GET',
                headers: {
                    'accept': 'application/json',
                    'X-Extension-Request': 'popup-test'
                }
            });

            if (response.ok) {
                showStatus('API connection successful!', 'success');
            } else {
                showStatus(`API test failed: ${response.status}`, 'error');
            }
        } catch (error) {
            showStatus(`Connection error: ${error.message}`, 'error');
        } finally {
            testApiButton.disabled = false;
            testApiButton.textContent = 'Test API Connection';
        }
    });

    // Invoke API for current ticket
    invokeApiButton.addEventListener('click', function() {
        if (!currentTicketId) {
            showStatus('No ticket ID found', 'error');
            return;
        }

        chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
            chrome.tabs.sendMessage(tabs[0].id, {
                action: 'manualInvoke',
                ticketId: currentTicketId
            }, function(response) {
                if (chrome.runtime.lastError) {
                    showStatus('Failed to communicate with page', 'error');
                } else {
                    showStatus('API invocation requested', 'success');
                }
            });
        });
    });

    function showStatus(message, type) {
        statusDiv.textContent = message;
        statusDiv.className = `status ${type}`;
        statusDiv.style.display = 'block';

        setTimeout(() => {
            statusDiv.style.display = 'none';
        }, 3000);
    }
});