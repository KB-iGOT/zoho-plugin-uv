import os

# Base paths; change path incase you have different directory structure.
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
# DATA_DIR = os.path.join(BASE_DIR, "data")
MODELS_DIR = os.path.join(BASE_DIR, "models")
VECTORS_DIR = os.path.join(BASE_DIR, "vectors")
# OUTPUT_DIR = os.path.join(BASE_DIR, "output")

# Create directories if they don't exist
# for directory in [MODELS_DIR, VECTORS_DIR]:
#     os.makedirs(directory, exist_ok=True)

# Data files, fix this
# TODO: add values from arg inputs.
# TRAINING_DATA_PATH = os.path.join(DATA_DIR, "zoho_train.csv")
# # TRAINING_DATA_PATH = os.path.join(DATA_DIR, "Ticket_1738916224125.csv")
# # BENCHMARK_DATA_PATH = os.path.join(DATA_DIR, "benchmark.csv")
# BENCHMARK_DATA_PATH = os.path.join(DATA_DIR, "Ticket_1738916224125.csv")
# OUTPUT_FILE_PATH = os.path.join(OUTPUT_DIR, "predictions.csv")

# Model files, feel free to change.
NB_CLASSIFIER_CLASSIFICATION_PATH = os.path.join(MODELS_DIR, "nb_classifier_classification.joblib")
NB_CLASSIFIER_CATEGORY_PATH = os.path.join(MODELS_DIR, "nb_classifier_category.joblib")
RF_CLASSIFIER_CLASSIFICATION_PATH = os.path.join(MODELS_DIR, "rf_classifier_classification.joblib")
RF_CLASSIFIER_CATEGORY_PATH = os.path.join(MODELS_DIR, "rf_classifier_category.joblib")

# Vector files
TFIDF_VECTORIZER_PATH = os.path.join(VECTORS_DIR, "tfidf_vectorizer.joblib")
CLASSIFICATION_ENCODER_PATH = os.path.join(VECTORS_DIR, "classification_encoder.joblib")
CATEGORY_ENCODER_PATH = os.path.join(VECTORS_DIR, "category_encoder.joblib")

# Model parameters
TFIDF_MAX_FEATURES = 5000
TFIDF_NGRAM_RANGE = (1, 2)
RANDOM_FOREST_ESTIMATORS = 100
RANDOM_STATE = 42
TEST_SIZE = 0.2

# Input data columns
REQUIRED_COLUMNS = {
    'ticket_id': 'Ticket ID',
    'subject': 'Subject',
    'description': 'Ticket Description',
    'classification': 'Classifications',
    'category': 'Categories',
    'subcategory': 'Subcategories'
}

# Add debug prints
#print("Configuration paths:")
#print(f"BASE_DIR: {BASE_DIR}")
#print(f"OUTPUT_DIR: {OUTPUT_DIR}")
#print(f"Classification matrix path: {os.path.join(OUTPUT_DIR, 'classification_confusion_matrix.png')}")
#print(f"Category matrix path: {os.path.join(OUTPUT_DIR, 'category_confusion_matrix.png')}")
