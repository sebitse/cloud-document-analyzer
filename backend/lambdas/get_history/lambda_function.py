import boto3

from shared.config import get_application_config, require_config_value
from shared.response import success_response, error_response


aws_region = require_config_value("aws", "region")
table_name = require_config_value("aws", "table_name")

app_config = get_application_config()
history_limit = app_config.get("history_limit", 20)

dynamodb = boto3.resource("dynamodb", region_name=aws_region)
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    try:
        response = table.scan()
        items = response.get("Items", [])

        items = sorted(
            items,
            key=lambda item: item.get("createdAt", ""),
            reverse=True,
        )

        return success_response({
            "items": items[:history_limit]
        })

    except Exception as exception:
        return error_response(str(exception), status_code=500)