from rest_framework.views import exception_handler
from rest_framework.response import Response
from rest_framework import status


def custom_exception_handler(exc, context):
    response = exception_handler(exc, context)

    if response is not None:
        if isinstance(response.data, dict):
            flattened = {}
            for key, value in response.data.items():
                if isinstance(value, list):
                    flattened[key] = value[0] if value else ""
                else:
                    flattened[key] = value
            response.data = flattened
        return response

    return Response(
        {"message": str(exc)},
        status=status.HTTP_500_INTERNAL_SERVER_ERROR,
    )
