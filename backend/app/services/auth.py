import hmac
import hashlib
import base64
import json
import time
import secrets
from typing import Optional, Dict, Any

# Simple secure secret key configuration
SECRET_KEY = "eventsphere-super-secret-key-change-in-production"
ALGORITHM = "HS256"

# --- HELPER BASE64URL FUNCTIONS ---
def base64url_encode(data: bytes) -> str:
    encoded = base64.b64encode(data)
    return encoded.decode('utf-8').replace('+', '-').replace('/', '_').rstrip('=')

def base64url_decode(data: str) -> bytes:
    # Add padding back if necessary
    padding = len(data) % 4
    if padding == 2:
        data += "=="
    elif padding == 3:
        data += "="
    decoded = data.replace('-', '+').replace('_', '/')
    return base64.b64decode(decoded)

# --- JWT FUNCTIONS ---
def create_access_token(data: dict, expires_in_seconds: int = 86400) -> str:
    """
    Creates a JWT access token valid for a specific duration.
    Default is 24 hours (86400 seconds).
    """
    header = {"alg": ALGORITHM, "typ": "JWT"}
    payload = data.copy()
    payload["exp"] = int(time.time()) + expires_in_seconds
    
    header_json = json.dumps(header, separators=(',', ':')).encode('utf-8')
    payload_json = json.dumps(payload, separators=(',', ':')).encode('utf-8')
    
    header_b64 = base64url_encode(header_json)
    payload_b64 = base64url_encode(payload_json)
    
    signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
    signature = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
    signature_b64 = base64url_encode(signature)
    
    return f"{header_b64}.{payload_b64}.{signature_b64}"

def verify_token(token: str) -> Optional[Dict[str, Any]]:
    """
    Verifies the JWT signature and expiration.
    Returns the decoded payload if valid, otherwise None.
    """
    try:
        parts = token.split('.')
        if len(parts) != 3:
            return None
        
        header_b64, payload_b64, signature_b64 = parts
        signing_input = f"{header_b64}.{payload_b64}".encode('utf-8')
        
        expected_sig = hmac.new(SECRET_KEY.encode('utf-8'), signing_input, hashlib.sha256).digest()
        actual_sig = base64url_decode(signature_b64)
        
        if not hmac.compare_digest(expected_sig, actual_sig):
            return None
        
        payload_bytes = base64url_decode(payload_b64)
        payload = json.loads(payload_bytes.decode('utf-8'))
        
        # Check expiration
        if payload.get("exp", 0) < time.time():
            return None
            
        return payload
    except Exception:
        return None

# --- PASSWORD HASHING (PBKDF2-HMAC-SHA256) ---
ITERATIONS = 100000

def get_password_hash(password: str) -> str:
    """
    Generates a secure PBKDF2 password hash with a random 16-byte salt.
    """
    salt = secrets.token_hex(16)
    pw_hash = hashlib.pbkdf2_hmac(
        'sha256',
        password.encode('utf-8'),
        salt.encode('utf-8'),
        ITERATIONS
    )
    return f"{salt}.{pw_hash.hex()}"

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Verifies a password against the stored salt and hash.
    """
    try:
        parts = hashed_password.split('.')
        if len(parts) != 2:
            return False
        salt, stored_hash = parts
        
        computed_hash = hashlib.pbkdf2_hmac(
            'sha256',
            plain_password.encode('utf-8'),
            salt.encode('utf-8'),
            ITERATIONS
        )
        return hmac.compare_digest(computed_hash.hex(), stored_hash)
    except Exception:
        return False
