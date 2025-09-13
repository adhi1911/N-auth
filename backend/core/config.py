import os 
from dotenv import load_dotenv

load_dotenv()

class Config:
    DOMAIN = os.getenv("DOMAIN")
    API_AUDIENCE = os.getenv("API_AUDIENCE")
    ISSUER = os.getenv("ISSUER")
    ALGORITHMS = os.getenv("ALGORITHMS")
    CLIENT_ID = os.getenv("CLIENT_ID")
    CLIENT_SECRET = os.getenv("CLIENT_SECRET")
    MAX_N = os.getenv("MAX_N")