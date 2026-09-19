#!/usr/bin/env python
import os
import sys


def main():
    os.environ.setdefault("DJANGO_SETTINGS_MODULE", "restaurant_backend.config.settings")
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Make sure it is installed and that the "
            "DJANGO_SETTINGS_MODULE environment variable is set correctly."
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == "__main__":
    main()
