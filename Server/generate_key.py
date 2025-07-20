import secrets
import string

def generate_secret_key(length=32):
    # Generate a random string with letters, digits, and special characters
    alphabet = string.ascii_letters + string.digits + string.punctuation
    secret_key = ''.join(secrets.choice(alphabet) for _ in range(length))
    return secret_key

if __name__ == "__main__":
    key = generate_secret_key()
    print("\nYour JWT Secret Key:")
    print(key)
    print("\nCopy this key and paste it into your .env file as JWT_SECRET_KEY") 