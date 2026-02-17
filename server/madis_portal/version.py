import os
from pathlib import Path


def get_version():
    """Read version from VERSION file at the project root."""
    version_file = Path(__file__).resolve().parent.parent / 'VERSION'
    try:
        return version_file.read_text().strip()
    except FileNotFoundError:
        return '0.0.0'


__version__ = get_version()
