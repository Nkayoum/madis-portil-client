import os
from pathlib import Path

log_path = Path("logs/madis_portal.log")
if log_path.exists():
    with open(log_path, "r", encoding="utf-8", errors="ignore") as f:
        lines = f.readlines()
        for line in lines[-20:]:
            print(line.strip())
else:
    print("Log file not found.")
