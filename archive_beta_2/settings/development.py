from .base import *

DEBUG = True

ALLOWED_HOSTS = [
    "*"
]


STATIC_ROOT = ""
STATICFILES_DIRS = [Path.joinpath(BASE_DIR, "static"),]
