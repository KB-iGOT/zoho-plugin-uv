// Content script for Zoho Ticket API Invoker
(function() {
    'use strict';

    const API_BASE_URL = 'https://support.uat.karmayogibharat.net/zoho_plugin/ticket/details';
//      const API_BASE_URL = 'http://127.0.0.1:8000/ticket/details';


    // Extract ticket ID from URL
    function extractTicketId() {
        const url = window.location.href;
        const match = url.match(/tickets\/details\/(\d+)/);
        return match ? match[1] : null;
    }

    // Invoke API via background script
    async function invokeAPI(ticketId) {
        try {
            console.log('Invoking API for ticket ID:', ticketId);
            showNotification('Fetching ticket details...', 'info');

            const response = await chrome.runtime.sendMessage({
                action: 'makeAPICall',
                ticketId: ticketId,
                apiUrl: `${API_BASE_URL}/${ticketId}`
            });

            if (!response.success) {
                throw new Error(response.error);
            }

            console.log('API response:', response.data);
            displayUserDetails(response.data);
            showNotification('Ticket details fetched successfully', 'success');

        } catch (error) {
            console.error('Error invoking API:', error);
            showNotification('Failed to fetch ticket details: ' + error.message, 'error');
            displayUserDetails({
                error: error.message,
                ticketId: ticketId,
                troubleshooting: 'Try refreshing the page and ensure you are logged into Zoho Desk'
            });
        }
    }

    // Display results in floating widget
    function displayUserDetails(data) {
        const existingWidget = document.getElementById('zoho-user-details-widget');
        if (existingWidget) existingWidget.remove();

        const widget = document.createElement('div');
        widget.id = 'zoho-user-details-widget';
        widget.style.cssText = `
            position: fixed; bottom: 20px; left: 20px; z-index: 10000;
            width: 500px; min-width: 350px; max-width: 900px;
            height: 600px; min-height: 300px; max-height: 85vh;
            background: white; border: 1px solid #ddd; border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px; line-height: 1.4;
            resize: both; overflow: hidden;
            display: flex; flex-direction: column;
            transition: all 0.3s ease;
        `;

        const header = document.createElement('div');
        header.style.cssText = `
            background: #1976d2; color: white; padding: 12px 16px;
            border-radius: 8px 8px 0 0; font-weight: 600;
            display: flex; justify-content: space-between; align-items: center;
            flex-shrink: 0; cursor: move;
        `;
        header.innerHTML = `
            <span>🎫 Ticket Details</span>
            <div style="display: flex; gap: 8px; align-items: center;">
                <button class="widget-minimize" title="Minimize"
                        style="background: none; border: none; color: white; font-size: 14px; cursor: pointer;">−</button>
                <button class="widget-size-toggle" title="Toggle size"
                        style="background: none; border: none; color: white; font-size: 14px; cursor: pointer;">⛶</button>
                <button class="widget-close" title="Close"
                        style="background: none; border: none; color: white; font-size: 16px; cursor: pointer;">×</button>
            </div>
        `;

        // JSON View Controls
        const viewControls = document.createElement('div');
        viewControls.style.cssText = `
            background: #f5f5f5; padding: 8px 16px; border-bottom: 1px solid #ddd;
            display: flex; gap: 8px; align-items: center; flex-wrap: wrap; flex-shrink: 0;
        `;
        viewControls.innerHTML = `
            <span style="font-weight: 600; color: #333; margin-right: 8px;">View:</span>
            <button class="view-btn active" data-view="tree"
                    style="padding: 4px 12px; border: 1px solid #2196f3; border-radius: 4px;
                           background: #2196f3; color: white; cursor: pointer; font-size: 12px;">Tree</button>
            <button class="view-btn" data-view="code"
                    style="padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px;
                           background: white; color: #333; cursor: pointer; font-size: 12px;">Code</button>
            <button class="view-btn" data-view="table"
                    style="padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px;
                           background: white; color: #333; cursor: pointer; font-size: 12px;">Table</button>
            <button class="view-btn" data-view="form"
                    style="padding: 4px 12px; border: 1px solid #ddd; border-radius: 4px;
                           background: white; color: #333; cursor: pointer; font-size: 12px;">Form</button>
        `;

        const content = document.createElement('div');
        content.id = 'user_details';
        content.style.cssText = 'padding: 16px; overflow-y: auto; flex: 1;';

        if (data.error) {
            content.innerHTML = `
                <div style="color: #d32f2f; padding: 12px; background: #ffebee; border-radius: 4px; margin-bottom: 12px;">
                    <strong>❌ Error:</strong> ${data.error}
                </div>
                ${data.troubleshooting ? `
                <div style="color: #ff9800; padding: 12px; background: #fff3e0; border-radius: 4px; font-size: 12px;">
                    <strong>💡 Troubleshooting:</strong> ${data.troubleshooting}
                </div>
                ` : ''}
            `;
        } else {
            content.innerHTML = formatDataAsTree(data);
        }

        widget.appendChild(header);
        widget.appendChild(viewControls);
        widget.appendChild(content);
        document.body.appendChild(widget);

        // Store the original data for view switching
        widget._originalData = data;
        widget._isMinimized = false;

        // Add event listeners for all interactive elements
        setupWidgetEventListeners(widget);

        // Make widget draggable
        makeDraggable(widget, header);
    }

    // Setup event listeners for widget interactions
    function setupWidgetEventListeners(widget) {
        // View switcher buttons
        widget.querySelectorAll('.view-btn').forEach(button => {
            button.addEventListener('click', function() {
                const view = this.getAttribute('data-view');
                const content = widget.querySelector('#user_details');
                const data = widget._originalData;

                // Update active button
                widget.querySelectorAll('.view-btn').forEach(btn => {
                    btn.style.background = 'white';
                    btn.style.color = '#333';
                    btn.classList.remove('active');
                });
                this.style.background = '#2196f3';
                this.style.color = 'white';
                this.classList.add('active');

                // Switch view
                switch(view) {
                    case 'tree':
                        content.innerHTML = formatDataAsTree(data);
                        setupTreeToggleListeners(widget);
                        setupCopyFieldListeners(widget);
                        break;
                    case 'code':
                        content.innerHTML = formatDataAsCode(data);
                        break;
                    case 'table':
                        content.innerHTML = formatDataAsTable(data);
                        break;
                    case 'form':
                        content.innerHTML = formatDataAsForm(data);
                        break;
                }
            });
        });

        // Copy JSON button
        const copyBtn = widget.querySelector('.copy-json-btn');
        if (copyBtn) {
            copyBtn.addEventListener('click', function() {
                const data = widget._originalData;
                navigator.clipboard.writeText(JSON.stringify(data, null, 2)).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '✅ Copied!';
                    this.style.background = '#4CAF50';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.background = '#4CAF50';
                    }, 2000);
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    this.innerHTML = '❌ Failed';
                    setTimeout(() => {
                        this.innerHTML = '📋 Copy';
                    }, 2000);
                });
            });
        }

        // Initial tree toggle setup
        setupTreeToggleListeners(widget);

        // Setup copy field buttons
        setupCopyFieldListeners(widget);

        // Widget minimize button
        const minimizeBtn = widget.querySelector('.widget-minimize');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', function() {
                const viewControls = widget.querySelector('div[style*="background: #f5f5f5"]');
                const content = widget.querySelector('#user_details');

                if (widget._isMinimized) {
                    // Restore widget to original size
                    widget.style.width = widget._originalWidth || '500px';
                    widget.style.height = widget._originalHeight || '600px';
                    viewControls.style.display = 'flex';
                    content.style.display = 'block';
                    this.innerHTML = '−';
                    this.title = 'Minimize';
                    widget._isMinimized = false;
                } else {
                    // Store original dimensions
                    widget._originalWidth = widget.style.width;
                    widget._originalHeight = widget.style.height;

                    // Minimize widget to 25% of default size
                    const defaultWidth = 500;
                    const defaultHeight = 600;
                    const minimizedWidth = Math.round(defaultWidth * 0.25);
                    const minimizedHeight = Math.round(defaultHeight * 0.25);

                    widget.style.width = minimizedWidth + 'px';
                    widget.style.height = minimizedHeight + 'px';
                    viewControls.style.display = 'none';
                    content.style.display = 'none';
                    this.innerHTML = '⬜';
                    this.title = 'Maximize';
                    widget._isMinimized = true;
                }
            });
        }

        // Widget size toggle button
        const sizeToggleBtn = widget.querySelector('.widget-size-toggle');
        if (sizeToggleBtn) {
            sizeToggleBtn.addEventListener('click', function() {
                const currentWidth = parseInt(widget.style.width);

                if (currentWidth <= 500) {
                    // Expand to large size
                    widget.style.width = '800px';
                    widget.style.height = '700px';
                    this.title = 'Minimize size';
                } else {
                    // Minimize to default size
                    widget.style.width = '500px';
                    widget.style.height = '600px';
                    this.title = 'Expand size';
                }
            });
        }

        // Widget close button
        const closeBtn = widget.querySelector('.widget-close');
        if (closeBtn) {
            closeBtn.addEventListener('click', function() {
                widget.remove();
            });
        }
    }

    // Setup tree toggle listeners
    function setupTreeToggleListeners(widget) {
        widget.querySelectorAll('.tree-toggle').forEach(button => {
            button.addEventListener('click', function() {
                const targetId = this.getAttribute('data-target');
                const element = document.getElementById(targetId);

                if (element) {
                    if (element.style.display === 'none') {
                        element.style.display = 'block';
                        this.textContent = '▼';
                    } else {
                        element.style.display = 'none';
                        this.textContent = '▶';
                    }
                }
            });
        });
    }

    // Setup copy field button listeners
    function setupCopyFieldListeners(widget) {
        widget.querySelectorAll('.copy-field-btn').forEach(button => {
            button.addEventListener('click', function() {
                const value = this.getAttribute('data-value');
                const fieldName = this.getAttribute('title').replace('Copy ', '');

                navigator.clipboard.writeText(value).then(() => {
                    const originalText = this.innerHTML;
                    this.innerHTML = '✅';
                    this.style.background = '#4CAF50';
                    setTimeout(() => {
                        this.innerHTML = originalText;
                        this.style.background = '#4CAF50';
                    }, 1500);

                    // Show brief notification
                    showNotification(`${fieldName} copied to clipboard`, 'success');
                }).catch(err => {
                    console.error('Failed to copy:', err);
                    this.innerHTML = '❌';
                    setTimeout(() => {
                        this.innerHTML = '📋';
                    }, 1500);
                });
            });
        });
    }

    // Format data as tree view with selective copy buttons
    function formatDataAsTree(data, level = 0) {
        if (!data || typeof data !== 'object') {
            return '<div style="color: #666;">No data available</div>';
        }

        const indent = level * 20;
        let html = '';

        Object.entries(data).forEach(([key, value], index) => {
            const nodeId = `node-${level}-${index}-${Math.random().toString(36).substr(2, 9)}`;
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

            if (typeof value === 'object' && value !== null) {
                const childCount = Array.isArray(value) ? value.length : Object.keys(value).length;
                const isArray = Array.isArray(value);

                html += `
                    <div style="margin-left: ${indent}px; margin-bottom: 4px;">
                        <div style="display: flex; align-items: center; padding: 2px 0;">
                            <button class="tree-toggle" data-target="${nodeId}"
                                    style="background: none; border: none; cursor: pointer; padding: 2px 6px;
                                           color: #666; font-size: 12px; margin-right: 4px;">▼</button>
                            <span style="font-weight: 600; color: #1976d2;">${formattedKey}</span>
                            <span style="color: #666; font-size: 12px; margin-left: 8px;">
                                ${isArray ? `Array[${childCount}]` : `Object{${childCount}}`}
                            </span>
                        </div>
                        <div id="${nodeId}" style="margin-left: 16px;">
                            ${formatDataAsTree(value, level + 1)}
                        </div>
                    </div>
                `;
            } else {
                const valueColor = getValueColor(value);
                const displayValue = formatValue(value);

                // Check if this is a user_id field with error messages
                const isUserIdError = (key.toLowerCase() === 'user_id' || key.toLowerCase() === 'userid') &&
                                      typeof value === 'string' &&
                                      (value.includes('!!!! NO ACTIVE USER ACCOUNT FOUND !!!!') ||
                                       value.includes('!!! USER NOT FOUND !!!'));

                // Apply special styling for user_id error messages
                const errorStyle = isUserIdError ? 'font-weight: bold; color: #d32f2f !important;' : '';

                // Define which fields should have copy buttons
                const copyableFields = [
                    'user id', 'id', 'userid', 'user_id',
                    'predicted classification', 'predictedclassification', 'predicted_classification',
                    'predicted category', 'predictedcategory', 'predicted_category',
                    'classification', 'category',
                    'phone', 'email', 'mobile', 'telephone',
                    'name', 'username', 'user_name',
                    'organization', 'org', 'company',
                    'subject', 'title',
                    'status', 'state',
                    'language', 'locale',
                    'channel', 'source'
                ];

                // Check if field should have copy button (but not for error messages)
                const shouldShowCopyButton = value !== null &&
                                           value !== undefined &&
                                           value !== '' &&
                                           typeof value !== 'object' &&
                                           !isUserIdError && // Don't show copy button for error messages
                                           (copyableFields.some(field =>
                                               formattedKey.toLowerCase().includes(field) ||
                                               key.toLowerCase().includes(field)
                                           ));

                const copyButton = shouldShowCopyButton ?
                    `<button class="copy-field-btn" data-value="${value}" title="Copy ${formattedKey}"
                            style="margin-left: 8px; padding: 2px 6px; border: 1px solid #4CAF50; border-radius: 3px;
                                   background: #4CAF50; color: white; cursor: pointer; font-size: 10px;">📋</button>` : '';

                html += `
                    <div style="margin-left: ${indent}px; margin-bottom: 4px; display: flex; align-items: center; padding: 2px 0;">
                        <span style="font-weight: 500; color: #333; margin-right: 8px; min-width: 120px;">${formattedKey}:</span>
                        <span style="color: ${valueColor}; word-break: break-word; ${errorStyle}">${displayValue}</span>
                        ${copyButton}
                    </div>
                `;
            }
        });

        return html || '<div style="color: #666; font-style: italic;">No data available</div>';
    }

    // Format data as code view
    function formatDataAsCode(data) {
        const jsonString = JSON.stringify(data, null, 2);
        return `
            <pre style="background: #1e1e1e; color: #d4d4d4; padding: 16px; border-radius: 4px;
                       font-family: 'Monaco', 'Menlo', 'Consolas', monospace; font-size: 12px;
                       line-height: 1.4; overflow-x: auto; margin: 0;">${syntaxHighlightJSON(jsonString)}</pre>
        `;
    }

    // Format data as table view
    function formatDataAsTable(data) {
        if (!data || typeof data !== 'object') {
            return '<div style="color: #666;">No data available</div>';
        }

        let html = `
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background: #f5f5f5;">
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600;">Property</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600;">Value</th>
                        <th style="border: 1px solid #ddd; padding: 8px; text-align: left; font-weight: 600;">Type</th>
                    </tr>
                </thead>
                <tbody>
        `;

        Object.entries(data).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const valueType = Array.isArray(value) ? 'Array' : typeof value;
            let displayValue = formatValue(value);

            if (typeof value === 'object' && value !== null) {
                displayValue = `<pre style="font-size: 11px; max-height: 100px; overflow-y: auto;">${JSON.stringify(value, null, 2)}</pre>`;
            }

            html += `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="border: 1px solid #ddd; padding: 8px; font-weight: 500; vertical-align: top;">${formattedKey}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; word-break: break-word; vertical-align: top;">${displayValue}</td>
                    <td style="border: 1px solid #ddd; padding: 8px; color: #666; vertical-align: top;">${valueType}</td>
                </tr>
            `;
        });

        html += '</tbody></table>';
        return html;
    }

    // Format data as form view
    function formatDataAsForm(data) {
        if (!data || typeof data !== 'object') {
            return '<div style="color: #666;">No data available</div>';
        }

        let html = '<div style="max-width: 100%;">';

        Object.entries(data).forEach(([key, value]) => {
            const formattedKey = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            let inputElement = '';

            if (typeof value === 'object' && value !== null) {
                inputElement = `
                    <textarea readonly style="width: 100%; min-height: 100px; padding: 8px; border: 1px solid #ddd;
                             border-radius: 4px; font-family: monospace; font-size: 12px; resize: vertical;">${JSON.stringify(value, null, 2)}</textarea>
                `;
            } else {
                const inputType = typeof value === 'number' ? 'number' : 'text';
                inputElement = `
                    <input type="${inputType}" readonly value="${value || ''}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;
                                  background: #f9f9f9; font-size: 13px;">
                `;
            }

            html += `
                <div style="margin-bottom: 16px;">
                    <label style="display: block; font-weight: 600; color: #333; margin-bottom: 4px;">${formattedKey}:</label>
                    ${inputElement}
                </div>
            `;
        });

        html += '</div>';
        return html;
    }

    // Helper functions
    function getValueColor(value) {
        if (value === null) return '#f57c00';
        if (typeof value === 'boolean') return '#7b1fa2';
        if (typeof value === 'number') return '#1976d2';
        if (typeof value === 'string') return '#388e3c';
        return '#666';
    }

    function formatValue(value) {
        if (value === null) return '<em>null</em>';
        if (value === undefined) return '<em>undefined</em>';
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        if (typeof value === 'string' && value.length > 100) {
            return `<span title="${value}">${value.substring(0, 100)}...</span>`;
        }
        return String(value);
    }

    function syntaxHighlightJSON(json) {
        return json
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
                let cls = 'number';
                if (/^"/.test(match)) {
                    if (/:$/.test(match)) {
                        cls = 'key';
                    } else {
                        cls = 'string';
                    }
                } else if (/true|false/.test(match)) {
                    cls = 'boolean';
                } else if (/null/.test(match)) {
                    cls = 'null';
                }
                const colors = {
                    key: '#92c5f7',
                    string: '#ce9178',
                    number: '#b5cea8',
                    boolean: '#569cd6',
                    null: '#ff6b6b'
                };
                return `<span style="color: ${colors[cls]}">${match}</span>`;
            });
    }

    // Show notification
    function showNotification(message, type = 'info') {
        // Remove existing notifications
        const existingNotifications = document.querySelectorAll('.zoho-api-notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = 'zoho-api-notification';
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px; z-index: 10001;
            padding: 12px 16px; border-radius: 6px; color: white;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 13px; transition: all 0.3s ease; max-width: 300px;
            ${type === 'success' ? 'background-color: #4CAF50;' :
              type === 'error' ? 'background-color: #f44336;' :
              type === 'info' ? 'background-color: #2196F3;' : 'background-color: #ff9800;'}
        `;
        notification.textContent = message;
        document.body.appendChild(notification);

        // Auto-remove notification
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(50px)';
            setTimeout(() => notification.remove(), 300);
        }, type === 'error' ? 5000 : 3000);
    }

    // Check and invoke API
    function checkAndInvokeAPI() {
        const ticketId = extractTicketId();
        if (ticketId) {
            console.log('Detected Zoho ticket page with ID:', ticketId);
            invokeAPI(ticketId);
        } else {
            console.log('Not on a Zoho ticket page or ticket ID not found');
        }
    }

    // Wait for page load
    function waitForPageLoad() {
        if (document.readyState === 'complete') {
            setTimeout(checkAndInvokeAPI, 1500);
        } else {
            window.addEventListener('load', () => {
                setTimeout(checkAndInvokeAPI, 1500);
            });
        }
    }

    // Handle navigation changes (for SPAs)
    let lastUrl = location.href;
    new MutationObserver(() => {
        const url = location.href;
        if (url !== lastUrl) {
            lastUrl = url;
            console.log('URL changed to:', url);
            setTimeout(checkAndInvokeAPI, 2000);
        }
    }).observe(document, { subtree: true, childList: true });

    // Handle manual invoke from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
        if (request.action === 'manualInvoke') {
            const ticketId = request.ticketId || extractTicketId();
            if (ticketId) {
                invokeAPI(ticketId);
                sendResponse({ status: 'invoked', ticketId: ticketId });
            } else {
                sendResponse({ status: 'error', message: 'No ticket ID found in current URL' });
            }
        }
        return true;
    });

    // Initialize
    console.log('🎫 Zoho Ticket API Invoker loaded');
    console.log('🎯 Current URL:', window.location.href);
    console.log('🎯 Ticket ID detected:', extractTicketId());

    waitForPageLoad();

    // Add utility functions to global scope for inline event handlers
    if (!window.zohoApiExtensionUtils) {
        window.zohoApiExtensionUtils = {};

        window.zohoApiExtensionUtils.toggleJsonCollapse = function(id) {
            const element = document.getElementById(id);
            const icon = document.getElementById(id + '-icon');
            if (element && icon) {
                if (element.style.display === 'none') {
                    element.style.display = 'block';
                    icon.textContent = '▲';
                } else {
                    element.style.display = 'none';
                    icon.textContent = '▼';
                }
            }
        };

        window.zohoApiExtensionUtils.toggleTextExpand = function(id) {
            const shortElement = document.getElementById(id + '-short');
            const fullElement = document.getElementById(id + '-full');
            const btnElement = document.getElementById(id + '-btn');

            if (shortElement && fullElement && btnElement) {
                if (fullElement.style.display === 'none') {
                    shortElement.style.display = 'none';
                    fullElement.style.display = 'inline';
                    btnElement.textContent = 'Show less';
                } else {
                    shortElement.style.display = 'inline';
                    fullElement.style.display = 'none';
                    btnElement.textContent = 'Show more';
                }
            }
        };

        window.zohoApiExtensionUtils.toggleWidgetSize = function(button) {
            const widget = button.closest('#zoho-user-details-widget');
            if (widget) {
                const currentWidth = parseInt(widget.style.width);

                if (currentWidth <= 350) {
                    // Expand to large size
                    widget.style.width = '600px';
                    widget.style.height = '600px';
                    button.title = 'Minimize';
                } else {
                    // Minimize to default size
                    widget.style.width = '350px';
                    widget.style.height = '400px';
                    button.title = 'Expand';
                }
            }
        };
    }

    // Make widget draggable
    function makeDraggable(widget, handle) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        handle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);

        function dragStart(e) {
            if (e.target.tagName === 'BUTTON') return; // Don't drag when clicking buttons

            initialX = e.clientX - xOffset;
            initialY = e.clientY - yOffset;

            if (e.target === handle) {
                isDragging = true;
                handle.style.cursor = 'grabbing';
            }
        }

        function drag(e) {
            if (isDragging) {
                e.preventDefault();
                currentX = e.clientX - initialX;
                currentY = e.clientY - initialY;

                xOffset = currentX;
                yOffset = currentY;

                // Keep widget within viewport bounds
                const rect = widget.getBoundingClientRect();
                const maxX = window.innerWidth - rect.width;
                const maxY = window.innerHeight - rect.height;

                currentX = Math.max(0, Math.min(currentX, maxX));
                currentY = Math.max(0, Math.min(currentY, maxY));

                widget.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        }

        function dragEnd(e) {
            initialX = currentX;
            initialY = currentY;
            isDragging = false;
            handle.style.cursor = 'move';
        }
    }

})();