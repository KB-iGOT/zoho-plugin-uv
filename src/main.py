import os
from typing import Optional

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi import Header
from dotenv import load_dotenv

from src import utils
from src.inference import TicketPredictor

load_dotenv()

app = FastAPI(
    title="Karmayogi Bharat ZOHO Ticket Support API",
    description="API for the Karmayogi Bharat ZOHO ticket support service",
    version="1.0.0",
    docs_url=None
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*", "https://desk.zoho.in"],
    allow_credentials=True,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["*"],
)


@app.get("/root")
async def root():
    """Root endpoint to verify server status."""
    return {"message": "This is Karmayogi Bharat ZOHO ticket support service REST integration !!"}


@app.get("/ticket/details/{ticket_id}")
async def get_ticket_user_details(
        ticket_id: str,
        x_zoho_cookies: Optional[str] = Header(None, alias="X-Zoho-Cookies")
):
    print("Ticket ID:", ticket_id)
    print("Zoho Cookies:", x_zoho_cookies)  # This will now contain the cookies
    print("BASE PATH:: ", os.path.dirname(os.path.abspath(__file__)))
    # # Use the cookies to make authenticated requests to Zoho APIs
    # access_token = utils.get_access_token()
    # print("Access Token: ", access_token)

    # Pass the cookies to your Zoho API calls
    ticket_details = utils.get_ticket_details(
        ticket_id,
        os.getenv("ZOHO_ORG_ID"),
        access_token=None,
        cookie=x_zoho_cookies  # Use the cookies here
    )

    if not ticket_details:
        return {"error": "Ticket details not found."}

    print("Ticket Details: ", ticket_details)
    user_email = ticket_details.get("email").lower()

    if not user_email:
        return {"error": "User email not found in ticket details."}

    user_details_list = utils.get_user_details_from_igot(user_email)

    # fetch ticket categories and sub-categories
    # Initialize predictor
    predictor = TicketPredictor()

    # Process tickets
    classification_prediction = predictor.predict_tickets(ticket_details)
    print("Classification Prediction: ", classification_prediction)

    # return user details if user details are found else throw an error
    if user_details_list:

        # fetch the user details which has status as 1 from user_details_list
        active_user_details = next((user for user in user_details_list if user.get("status") == 1), None)

        if not active_user_details:
            return {
                "classification_prediction": classification_prediction,
                "user_id": "!!!! NO ACTIVE USER ACCOUNT FOUND !!!!",
                "user_details_list": user_details_list
            }
        else:
            return {
                "classification_prediction": classification_prediction,
                "user_id": active_user_details.get("id"),
                "profileDetails": active_user_details.get("profileDetails"),
                "active_user_details": active_user_details,
                "user_details_list": user_details_list
            }
    else:
        return {
            "classification_prediction": classification_prediction,
            "user_id": "!!! USER NOT FOUND !!!",
        }
