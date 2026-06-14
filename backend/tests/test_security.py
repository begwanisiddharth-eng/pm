"""Tests for password hashing."""

from app.security import hash_password, verify_password


def test_hash_roundtrip() -> None:
    stored = hash_password("s3cret")
    assert stored != "s3cret"
    assert "$" in stored
    assert verify_password("s3cret", stored)


def test_wrong_password_fails() -> None:
    stored = hash_password("s3cret")
    assert not verify_password("nope", stored)


def test_salts_differ() -> None:
    assert hash_password("same") != hash_password("same")


def test_malformed_stored_is_rejected() -> None:
    assert not verify_password("x", "not-a-valid-hash")
