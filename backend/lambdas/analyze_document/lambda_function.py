import json
import uuid
from datetime import datetime, timezone

import boto3

from shared.config import require_config_value
from shared.response import success_response, error_response


aws_region = require_config_value("aws", "region")
bucket_name = require_config_value("aws", "bucket_name")
table_name = require_config_value("aws", "table_name")

textract = boto3.client("textract", region_name=aws_region)
dynamodb = boto3.resource("dynamodb", region_name=aws_region)
table = dynamodb.Table(table_name)


def extract_lines_from_textract_response(textract_response):
    lines = []

    for block in textract_response.get("Blocks", []):
        if block.get("BlockType") == "LINE":
            text = block.get("Text", "")
            if text:
                lines.append(text)

    return lines


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body", "{}"))

        object_key = body.get("key")
        file_name = body.get("fileName", "unknown")

        if not object_key:
            return error_response("key is required", status_code=400)

        textract_response = textract.detect_document_text(
            Document={
                "S3Object": {
                    "Bucket": bucket_name,
                    "Name": object_key,
                }
            }
        )

        lines = extract_lines_from_textract_response(textract_response)
        extracted_text = "\n".join(lines)

        analysis_id = str(uuid.uuid4())
        created_at = datetime.now(timezone.utc).isoformat()

        item = {
            "analysisId": analysis_id,
            "fileName": file_name,
            "s3Key": object_key,
            "extractedText": extracted_text,
            "createdAt": created_at,
            "status": "COMPLETED",
        }

        table.put_item(Item=item)

        return success_response({
            "analysisId": analysis_id,
            "fileName": file_name,
            "s3Key": object_key,
            "extractedText": extracted_text,
            "createdAt": created_at,
            "status": "COMPLETED",
        })

    except Exception as exception:
        return error_response(str(exception), status_code=500)