"""Application settings loaded from environment variables / .env file."""
from __future__ import annotations

from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Central application settings.

    The `BC_*` block lets the BusinessCentralClient swap between the local
    mock connector and a real Microsoft BC tenant by changing BC_MODE.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore",
    )

    app_env: Literal["development", "staging", "production"] = "development"
    app_host: str = "0.0.0.0"
    app_port: int = 8000
    app_log_level: str = "INFO"
    secret_key: str = Field(default="change-me", min_length=8)

    database_url: str = "sqlite:///./data/bcsuite.db"

    cors_allow_origins: str = "http://localhost:5173,http://localhost:3000"

    high_risk_threshold: float = 100000.0

    bc_mode: Literal["mock", "real"] = "mock"
    bc_base_url: str = "https://api.businesscentral.dynamics.com/v2.0"
    bc_tenant_id: str = ""
    bc_environment: str = "Production"
    bc_company_id: str = ""
    bc_client_id: str = ""
    bc_client_secret: str = ""
    bc_api_publisher: str = "xu323"
    bc_api_group: str = "integration"
    bc_api_version: str = "v1.0"

    @property
    def cors_origins_list(self) -> list[str]:
        return [o.strip() for o in self.cors_allow_origins.split(",") if o.strip()]


settings = Settings()
