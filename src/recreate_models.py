#!/usr/bin/env python3
"""
Script to recreate joblib model files with better compatibility
This reads existing models and saves them with protocol=2 for cross-version compatibility
"""

import joblib
import pickle
import os
import sys
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)


def load_existing_model(file_path: str, model_name: str) -> Any:
    """
    Load existing model using multiple methods

    Args:
        file_path: Path to the existing model file
        model_name: Name for logging

    Returns:
        Loaded model object
    """
    logger.info(f"Loading existing {model_name} from {file_path}")

    if not os.path.exists(file_path):
        raise FileNotFoundError(f"Model file not found: {file_path}")

    # Try different loading methods
    loading_methods = [
        ("joblib.load", lambda: joblib.load(file_path)),
        ("joblib.load (no mmap)", lambda: joblib.load(file_path, mmap_mode=None)),
        ("pickle.load", lambda: pickle.load(open(file_path, 'rb'))),
    ]

    for method_name, load_func in loading_methods:
        try:
            model = load_func()
            logger.info(f"✓ Successfully loaded {model_name} using {method_name}")
            return model
        except Exception as e:
            logger.warning(f"Failed to load {model_name} with {method_name}: {e}")
            continue

    raise Exception(f"Failed to load {model_name} with all methods")


def save_compatible_model(model: Any, file_path: str, model_name: str) -> bool:
    """
    Save model with better compatibility

    Args:
        model: The model object to save
        file_path: Where to save the model
        model_name: Name for logging

    Returns:
        True if successful, False otherwise
    """
    logger.info(f"Saving {model_name} to {file_path}")

    # Create backup of original file
    backup_path = f"{file_path}.backup"
    if os.path.exists(file_path):
        os.rename(file_path, backup_path)
        logger.info(f"Created backup: {backup_path}")

    # Try saving with different methods
    saving_methods = [
        ("joblib (protocol=2)", lambda: joblib.dump(model, file_path, protocol=2)),
        ("joblib (protocol=3)", lambda: joblib.dump(model, file_path, protocol=3)),
        ("pickle (protocol=2)", lambda: pickle.dump(model, open(file_path, 'wb'), protocol=2)),
        ("joblib (default)", lambda: joblib.dump(model, file_path)),
    ]

    for method_name, save_func in saving_methods:
        try:
            save_func()
            logger.info(f"✓ Successfully saved {model_name} using {method_name}")

            # Verify the saved file can be loaded
            test_model = joblib.load(file_path)
            logger.info(f"✓ Verified {model_name} can be loaded after saving")
            return True

        except Exception as e:
            logger.warning(f"Failed to save {model_name} with {method_name}: {e}")
            continue

    # Restore backup if all methods failed
    if os.path.exists(backup_path):
        os.rename(backup_path, file_path)
        logger.warning(f"Restored backup for {model_name}")

    return False


def recreate_model_files(model_paths: Dict[str, str]) -> Dict[str, bool]:
    """
    Recreate all model files with better compatibility

    Args:
        model_paths: Dictionary mapping model names to file paths

    Returns:
        Dictionary with success status for each model
    """
    results = {}

    for model_name, file_path in model_paths.items():
        try:
            logger.info(f"\n{'=' * 50}")
            logger.info(f"Processing: {model_name}")
            logger.info(f"{'=' * 50}")

            # Load existing model
            model = load_existing_model(file_path, model_name)

            # Save with better compatibility
            success = save_compatible_model(model, file_path, model_name)
            results[model_name] = success

            if success:
                logger.info(f"✅ {model_name}: Successfully recreated")
            else:
                logger.error(f"❌ {model_name}: Failed to recreate")

        except Exception as e:
            logger.error(f"❌ {model_name}: Error - {e}")
            results[model_name] = False

    return results


def main():
    """Main function to recreate all model files"""

    # Define your model file paths

    # You can also get paths from your config if available
    try:
        import config
        model_paths = {
            "NB Classification Model": config.NB_CLASSIFIER_CLASSIFICATION_PATH,
            "RF Classification Model": config.RF_CLASSIFIER_CLASSIFICATION_PATH,
            "NB Category Model": config.NB_CLASSIFIER_CATEGORY_PATH,
            "RF Category Model": config.RF_CLASSIFIER_CATEGORY_PATH,
            "Classification Encoder": config.CLASSIFICATION_ENCODER_PATH,
            "Category Encoder": config.CATEGORY_ENCODER_PATH,
        }
        logger.info("Using paths from config.py")
    except ImportError:
        logger.info("config.py not found, using default paths")
        logger.info("Please update the model_paths dictionary with your actual file paths")

    # Check if files exist
    missing_files = []
    for name, path in model_paths.items():
        if not os.path.exists(path):
            missing_files.append(f"{name}: {path}")

    if missing_files:
        logger.error("Missing model files:")
        for missing in missing_files:
            logger.error(f"  - {missing}")
        logger.error("Please ensure all model files exist before running this script")
        sys.exit(1)

    logger.info("Starting model recreation process...")
    logger.info(f"Found {len(model_paths)} model files to process")

    # Recreate all models
    results = recreate_model_files(model_paths)

    # Print summary
    logger.info(f"\n{'=' * 60}")
    logger.info("RECREATION SUMMARY")
    logger.info(f"{'=' * 60}")

    successful = sum(1 for success in results.values() if success)
    total = len(results)

    for model_name, success in results.items():
        status = "✅ SUCCESS" if success else "❌ FAILED"
        logger.info(f"{model_name}: {status}")

    logger.info(f"\nOverall: {successful}/{total} models successfully recreated")

    if successful == total:
        logger.info("🎉 All models recreated successfully!")
        logger.info("You can now deploy these files to your server.")
    else:
        logger.warning("⚠️  Some models failed to recreate. Check the logs above.")
        logger.info("You may need to retrain the failed models from scratch.")

    return successful == total


if __name__ == "__main__":
    try:
        success = main()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        logger.info("\nOperation cancelled by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)