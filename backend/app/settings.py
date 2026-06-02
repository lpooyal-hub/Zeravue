import os

from dotenv import load_dotenv

load_dotenv()


class Settings:
    frontend_origin: str = os.getenv("FRONTEND_ORIGIN", "http://127.0.0.1:5173")
    supabase_url: str = os.getenv("SUPABASE_URL", "")
    supabase_service_role_key: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
    admin_dashboard_key: str = os.getenv("ADMIN_DASHBOARD_KEY", "")


settings = Settings()
