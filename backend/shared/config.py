import json
from pathlib import Path


_CONFIG_CACHE = None


def _find_config_file() -> Path:
    """
    Finds config/config.json both locally and inside an AWS Lambda deployment package.

    """
    current_file = Path(__file__).resolve()

    candidate_paths = [
        current_file.parents[1] / "config" / "config.json",
        Path.cwd() / "config" / "config.json",
        Path.cwd() / "backend" / "config" / "config.json",
    ]

    for path in candidate_paths:
        if path.exists():
            return path

    raise FileNotFoundError(
        "Could not find config.json. Expected it in backend/config/config.json "
        "or config/config.json inside the Lambda deployment package."
    )


def load_config() -> dict:
    global _CONFIG_CACHE

    if _CONFIG_CACHE is None:
        config_path = _find_config_file()

        with open(config_path, "r", encoding="utf-8") as file:
            _CONFIG_CACHE = json.load(file)

    return _CONFIG_CACHE


def get_aws_config() -> dict:
    return load_config().get("aws", {})


def get_application_config() -> dict:
    return load_config().get("application", {})


def get_cors_config() -> dict:
    return load_config().get("cors", {})


def require_config_value(section: str, key: str):
    config = load_config()

    if section not in config:
        raise KeyError(f"Missing config section: {section}")

    if key not in config[section]:
        raise KeyError(f"Missing config key: {section}.{key}")

    return config[section][key]


