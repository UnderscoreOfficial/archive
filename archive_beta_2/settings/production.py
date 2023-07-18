from .base import *

DEBUG = False

ALLOWED_HOSTS = [
    "127.0.0.1",
    "192.168.1.96"
]

STATIC_ROOT = Path.joinpath(BASE_DIR, "static")
