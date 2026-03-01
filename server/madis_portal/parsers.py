import json
from rest_framework.parsers import JSONParser
from rest_framework.exceptions import ParseError
import bleach
import logging

logger = logging.getLogger(__name__)

class SanitizedJSONParser(JSONParser):
    """
    Parses JSON data to a dictionary, then recursively sanitizes all string values 
    to remove any potentially malicious HTML/JS tags before they reach serializers.
    """
    
    def parse(self, stream, media_type=None, parser_context=None):
        try:
            data = super().parse(stream, media_type, parser_context)
            return self._sanitize_data(data)
        except Exception as exc:
            raise ParseError('JSON parse error - %s' % str(exc))

    def _sanitize_data(self, data):
        """Recursively sanitizes dicts, lists, and strings."""
        if isinstance(data, dict):
            return {k: self._sanitize_data(v) for k, v in data.items()}
        elif isinstance(data, list):
            return [self._sanitize_data(v) for v in data]
        elif isinstance(data, str):
            # Bleach removes HTML tags. We strip everything to be safe.
            # If the app needs specific tags (like <b> or <i>), we can whitelist them.
            # For this strict financial portal, we default to no HTML allowed.
            sanitized = bleach.clean(data, tags=[], attributes={}, strip=True)
            if sanitized != data:
                logger.warning("Sanitized HTML tags from incoming API request data.")
            return sanitized
        else:
            return data
