import os

import joblib
import nltk
import numpy as np
from nltk.corpus import stopwords
from nltk.stem import WordNetLemmatizer

from src import config

nltk.download('stopwords')
nltk.download('wordnet')
class TicketPredictor:
    def __init__(self):
        """Initialize the predictor by loading pretrained models and encoders."""
        try:
            print(config.NB_CLASSIFIER_CLASSIFICATION_PATH)
            # Check if all required files exist
            required_files = [
                (config.NB_CLASSIFIER_CLASSIFICATION_PATH, "NB Classification Model"),
                (config.RF_CLASSIFIER_CLASSIFICATION_PATH, "RF Classification Model"),
                (config.NB_CLASSIFIER_CATEGORY_PATH, "NB Category Model"),
                (config.RF_CLASSIFIER_CATEGORY_PATH, "RF Category Model"),
                (config.CLASSIFICATION_ENCODER_PATH, "Classification Encoder"),
                (config.CATEGORY_ENCODER_PATH, "Category Encoder")
            ]

            missing_files = []
            for file_path, file_desc in required_files:
                if not os.path.exists(file_path):
                    missing_files.append(f"{file_desc} at {file_path}")

            if missing_files:
                raise FileNotFoundError(
                    "Missing required files:\n" + "\n".join(missing_files) +
                    "\nPlease run train_model.py first to generate these files."
                )

            # Load models
            self.nb_classifier_classification = joblib.load(config.NB_CLASSIFIER_CLASSIFICATION_PATH)
            self.rf_classifier_classification = joblib.load(config.RF_CLASSIFIER_CLASSIFICATION_PATH)
            self.nb_classifier_category = joblib.load(config.NB_CLASSIFIER_CATEGORY_PATH)
            self.rf_classifier_category = joblib.load(config.RF_CLASSIFIER_CATEGORY_PATH)

            # Load encoders
            self.classification_encoder = joblib.load(config.CLASSIFICATION_ENCODER_PATH)
            self.category_encoder = joblib.load(config.CATEGORY_ENCODER_PATH)

            print("Models and encoders loaded successfully")
        except FileNotFoundError as e:
            raise Exception(f"Required model or encoder file not found:\n{e}")
        except Exception as e:
            raise Exception(f"Error loading models or encoders: {e}")

    def _preprocess_text(self, text):
        """Preprocess text: lowercase, remove stopwords, and lemmatize."""
        try:
            text = str(text)
            text = text.lower()
            stop_words = set(stopwords.words('english'))
            lemmatizer = WordNetLemmatizer()
            words = text.split()
            words = [lemmatizer.lemmatize(word) for word in words if word not in stop_words]
            return ' '.join(words)
        except Exception as e:
            print(f"Error preprocessing text: {e}")
            return text

    def predict_best_model(self, nb_model, rf_model, text):
        """Get prediction from both models and return the one with higher confidence."""
        try:
            # Get predictions and probabilities from both models
            nb_pred = nb_model.predict([text])[0]
            nb_prob = np.max(nb_model.predict_proba([text])[0])

            rf_pred = rf_model.predict([text])[0]
            rf_prob = np.max(rf_model.predict_proba([text])[0])

            # Return prediction from model with higher confidence
            # NOTE: you can remove the ML string name, if you don't want to save them.
            if nb_prob >= rf_prob:
                return nb_pred, nb_prob, "NB"
            else:
                return rf_pred, rf_prob, "RF"
        except Exception as e:
            print(f"Error in model prediction: {e}")
            return None, 0.0, "Error"

    def predict_tickets(self, ticket_details: dict):
        """Read ticket and generate predictions."""
        try:
            # Prepare text
            subject = str(ticket_details.get('subject', ''))
            description = str(ticket_details.get('description',''))
            processed_text = self._preprocess_text(subject + " " + description)

            # Get predictions
            class_pred, class_prob, class_model = self.predict_best_model(
                self.nb_classifier_classification,
                self.rf_classifier_classification,
                processed_text
            )

            cat_pred, cat_prob, cat_model = self.predict_best_model(
                self.nb_classifier_category,
                self.rf_classifier_category,
                processed_text
            )

            # Convert numeric predictions to labels
            predicted_classification = self.classification_encoder.inverse_transform([class_pred])[0]
            predicted_category = self.category_encoder.inverse_transform([cat_pred])[0]

            # Prepare result row, customize it or don't use this formatting. FOR TEST
            result = {
                # 'Ticket ID': ticket_details.get('id', ''),
                # 'Subject': subject,
                # 'Description': description,
                # 'Actual Classification': row.get('Classifications', ''),
                # 'Actual Category': row.get('Categories', ''),
                'Predicted Classification': str(predicted_classification),
                'Predicted Category': str(predicted_category),
                # 'Classification Confidence': f"{class_prob:.4f}",
                # 'Category Confidence': f"{cat_prob:.4f}",
                # 'Classification Model': class_model,
                # 'Category Model': cat_model
            }

            return result

        except Exception as e:
            print(f"Error processing input file: {e}")
            return None

