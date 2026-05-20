import json
import uuid

import boto3

from shared.config import get_application_config, require_config_value
from shared.response import success_response, error_response
from shared.logging_utils import log_event, log_error

aws_region = require_config_value("aws", "region")
bucket_name = require_config_value("aws", "bucket_name")

app_config = get_application_config()
upload_prefix = app_config.get("upload_prefix", "uploads/")
presigned_url_expiration = app_config.get("presigned_url_expiration", 300)

s3 = boto3.client("s3", region_name=aws_region)


def lambda_handler(event, context):
    try:
        log_event(
            "GENERATE_UPLOAD_URL_REQUEST_RECEIVED",
            lambdaRequestId=getattr(context, "aws_request_id", None)
        )

        body = json.loads(event.get("body", "{}"))

        file_name = body.get("fileName")
        content_type = body.get("contentType", "application/octet-stream")

        if not file_name:
            log_event("GENERATE_UPLOAD_URL_VALIDATION_FAILED", reason="Missing fileName")
            return error_response("fileName is required", status_code=400)

        file_extension = file_name.split(".")[-1]
        object_key = f"{upload_prefix}{uuid.uuid4()}.{file_extension}"

        upload_url = s3.generate_presigned_url(
            ClientMethod="put_object",
            Params={
                "Bucket": bucket_name,
                "Key": object_key,
                "ContentType": content_type,
            },
            ExpiresIn=presigned_url_expiration,
        )

        log_event(
            "UPLOAD_URL_GENERATED",
            fileName=file_name,
            contentType=content_type,
            s3Key=object_key,
            bucket=bucket_name
        )

        return success_response({
            "uploadUrl": upload_url,
            "key": object_key,
            "bucket": bucket_name,
        })

    except Exception as exception:
        log_error("GENERATE_UPLOAD_URL_FAILED", error=str(exception))
        return error_response(str(exception), status_code=500)