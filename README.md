# Zoho Ticket API Invoker

A Chrome extension that automatically captures Zoho authentication cookies and invokes a custom API service when Zoho ticket pages are loaded. This extension seamlessly integrates with custom API service to fetch additional ticket details and display them in a floating widget.

## 📋 About This Repository

This repository contains:
- **Chrome Extension**: Automatically captures complete Zoho cookies and triggers API calls
- **API Integration**: Sends captured cookies to your custom service via `X-Zoho-Cookies` header
- **Visual Interface**: Displays API response in a floating widget with `user_details` section
- **Automatic Detection**: Works on Zoho ticket detail pages without manual intervention
 

## 🔧 Chrome Extension Setup

### Prerequisites
- Google Chrome browser
- Developer mode enabled in Chrome Extensions

### Installation Steps

1. **Download Extension Files**
   ```bash
   git clone <repository-url>
   cd ZOHO-plugin-uv/extn
   ```

2. **Enable Chrome Developer Mode**
   - Open Chrome and navigate to `chrome://extensions/`
   - Toggle **"Developer mode"** in the top-right corner

3. **Load Extension**
   - Click **"Load unpacked"** button
   - Select the `extn` folder containing the extension files:
     - `manifest.json`
     - `background.js`
     - `content.js`
     - `popup.html`
     - `popup.js`

4. **Verify Installation**
   - Extension should appear in your extensions list
   - Look for "Zoho Ticket API Invoker" with version 1.0
   - Pin the extension to your toolbar (optional)

### Extension File Structure
```
extn/
├── manifest.json         # Extension configuration
├── background.js         # Service worker for cookie capture
├── content.js           # Content script for Zoho pages
├── popup.html           # Extension popup interface
└── popup.js             # Popup functionality
```

## 🚀 Local Service Setup

### Prerequisites
- Python 3.8+
- FastAPI
- Uvicorn
- git-lfs (for large files checkout - git pull won't download actual files in 'models' and 'vectors' directories)

### Installation Steps

1. **Navigate to Source Directory**
   ```bash
   cd src/
   ```

2. **Create Virtual Environment**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install Dependencies**
   ```bash
   pip install uv
   uv sync
   uv lock
   pip install git-lfs
   git lfs install
   git lfs pull
   ```

4. **Configure Environment Variables**
   ```bash
   # Create .env file
   echo "ZOHO_ORG_ID=your_zoho_org_id" > .env
   echo "ZOHO_ACCESS_TOKEN=your_access_token" >> .env
   echo "IGOT_API_TOKEN=your_igot_token" >> .env
   ```

5. **Start the Service**
   ```bash
   uvicorn main:app --reload --host 127.0.0.1 --port 8000
   ```

6. **Verify Service**
   - Open `http://127.0.0.1:8000/root` in your browser
   - You should see: "This is Karmayogi Bharat ZOHO ticket support service REST integration !!"

### API Endpoints

| Endpoint | Method | Description |
|----------|---------|-------------|
| `/` | GET | Health check endpoint |
| `/ticket/details/{ticket_id}` | GET | Main API endpoint that receives Zoho cookies |

### Expected Request Headers
The extension sends the following headers to your API:
```
X-Zoho-Cookies: <complete_cookie_string>
```

## 🔄 How It Works

1. **Cookie Capture**: Extension monitors all network requests to Zoho domains and captures complete authentication cookies
2. **Automatic Trigger**: When a Zoho ticket page loads, the extension extracts the ticket ID from the URL
3. **API Call**: Extension sends GET request to `http://127.0.0.1:8000/ticket/details/{ticket_id}` with captured cookies
4. **Response Display**: API response is formatted and displayed in a floating widget on the Zoho page


## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review browser console logs
- Verify API service is running correctly
- Ensure all prerequisites are met