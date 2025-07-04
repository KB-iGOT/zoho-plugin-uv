
import os
import requests

def get_access_token() -> str:
    """
    curl --location --request POST 'https://accounts.zoho.in/oauth/v2/token?refresh_token={refresh_token}&scope=Desk.tickets.ALL%2CDesk.contacts.READ%2CDesk.search.READ&grant_type=refresh_token' \
--header 'Cookie: _zcsr_tmp=2aaf399b-64ef-442e-bc5d-0990b7d50296; iamcsr=2aaf399b-64ef-442e-bc5d-0990b7d50296; zalb_6e73717622=cc36c6f8a6790832246efd66c032e512'
    """

    url = os.getenv("ZOHO_API_BASE_URL", "https://accounts.zoho.in")+os.getenv("ZOHO_ACCESS_TOKEN_API", "/oauth/v2/token")
    payload = {
        'refresh_token': os.getenv("ZOHO_REFRESH_TOKEN"),
        'client_id': os.getenv("ZOHO_CLIENT_ID"),
        'client_secret': os.getenv("ZOHO_CLIENT_SECRET"),
        'scope': 'Desk.tickets.ALL,Desk.contacts.READ,Desk.search.READ',
        'grant_type': 'refresh_token'
    }
    headers = {
        'Content-Type': 'application/x-www-form-urlencoded',
    }
    response = requests.post(url, data=payload, headers=headers)
    print("get_access_token:: response:: ", response.text)
    if response.status_code == 200:
        data = response.json()
        return data.get('access_token', '')
    else:
        raise Exception(f"Failed to get refresh token: {response.status_code} - {response.text}")


def get_ticket_details(ticket_id: str, orgId: str, access_token: str, cookie: str) -> dict:
    f"""
    Fetch ticket details using the provided ticket ID and access token.
    curl --location 'https://desk.zoho.in/api/v1/tickets/120349000058009045' \
    --header 'orgId: 60023043070' \
    --header 'Authorization: Zoho-oauthtoken access_token'
    """
    url = f"https://desk.zoho.in/api/v1/tickets/{ticket_id}"
    headers = {
        'orgId': orgId,
    }

    if access_token:
        headers['Authorization'] = f'Zoho-oauthtoken {access_token}'
    if cookie:
        headers['Cookie'] = cookie

    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        return response.json()
    else:
        raise Exception(f"Failed to fetch ticket details: {response.status_code} - {response.text}")


def get_user_details_from_igot(email: str) -> dict:
    """
    Fetch user details from iGOT using the provided email.

    curl --location 'https://portal.igotkarmayogi.gov.in/api/private/user/v1/search' \
    --header 'Content-Type: application/json' \
    --header 'Authorization: Bearer {api_key}' \
    --data-raw '{
        "request": {
            "filters": {
                "email": "anshu.aggarwal28@karmayogi.in"
            },
            "limit": 1,
            "sort_by": {"createdDate": "desc"}
        }
    }'
    """
    url = os.getenv("IGOT_API_BASE_URL", "https://portal.igotkarmayogi.gov.in/api")+os.getenv("IGOT_SEARCH_USER_API", "/private/user/v1/search")
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {os.getenv("IGOT_API_KEY")}',
    }
    payload = {
        "request": {
            "filters": {
                "email": email.lower()
            },
            "limit": 1,
            "sort_by": {"createdDate": "desc"}
        }
    }
    response = requests.post(url, json=payload, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data.get('result', {}).get('response').get('content'):
            return data['result']['response']['content']
        else:
            return {}
    else:
        raise Exception(f"Failed to fetch user details: {response.status_code} - {response.text}")

