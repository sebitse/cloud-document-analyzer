import boto3

from shared.config import get_application_config, require_config_value
from shared.response import success_response, error_response
from shared.logging_utils import log_event, log_error


aws_region = require_config_value("aws", "region")
table_name = require_config_value("aws", "table_name")

app_config = get_application_config()
history_limit = app_config.get("history_limit", 20)

dynamodb = boto3.resource("dynamodb", region_name=aws_region)
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    try:
        log_event(
            "GET_HISTORY_REQUEST_RECEIVED",
            lambdaRequestId=getattr(context, "aws_request_id", None)
        )

        response = table.scan()
        items = response.get("Items", [])

        items = sorted(
            items,
            key=lambda item: item.get("createdAt", ""),
            reverse=True,
        )

        returned_items = items[:history_limit]

        log_event(
            "HISTORY_LOADED",
            totalItemsScanned=len(items),
            itemsReturned=len(returned_items),
            tableName=table_name
        )

        return success_response({
            "items": returned_items
        })

    except Exception as exception:
        log_error("GET_HISTORY_FAILED", error=str(exception))
        return error_response(str(exception), status_code=500)
    
