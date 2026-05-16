import json

from shared.config import get_cors_config


def cors_headers():
    cors = get_cors_config()

    return {
        "Access-Control-Allow-Origin": cors.get("allow_origin", "*"),
        "Access-Control-Allow-Headers": cors.get(
            "allow_headers",
            "Content-Type,Authorization"
        ),
        "Access-Control-Allow-Methods": cors.get(
            "allow_methods",
            "OPTIONS,POST,GET"
        ),
    }


def success_response(data, status_code=200):
    return {
        "statusCode": status_code,
        "headers": cors_headers(),
        "body": json.dumps(data, default=str),
    }


def error_response(message, status_code=500):
    return {
        "statusCode": status_code,
        "headers": cors_headers(),
        "body": json.dumps({
            "error": message
        }),
    }

