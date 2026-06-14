"""Password hashing with stdlib PBKDF2."""

import hashlib
import hmac
import os

_ITERATIONS = 200_000


def hash_password(password: str) -> str:
    """Return a salted PBKDF2 hash encoded as 'salt_hex$digest_hex'."""
    salt = os.urandom(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return f"{salt.hex()}${digest.hex()}"


def verify_password(password: str, stored: str) -> bool:
    """Check a password against a stored 'salt_hex$digest_hex' hash."""
    salt_hex, _, digest_hex = stored.partition("$")
    if not digest_hex:
        return False
    salt = bytes.fromhex(salt_hex)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode(), salt, _ITERATIONS)
    return hmac.compare_digest(digest.hex(), digest_hex)
