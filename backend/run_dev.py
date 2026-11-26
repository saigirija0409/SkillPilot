"""Development server launcher that excludes .venv from Uvicorn file watching."""

from pathlib import Path
import uvicorn

from app.core.config import get_settings

BACKEND_DIR = Path(__file__).resolve().parent
APP_DIR = BACKEND_DIR / "app"


def main() -> None:
    settings = get_settings()
    uvicorn.run(
        "app.main:app",
        host=settings.app_host,
        port=settings.app_port,
        reload=True,
        reload_dirs=[str(APP_DIR)],
        reload_excludes=[".venv", "__pycache__", "*.pyc"],
    )


if __name__ == "__main__":
    main()
