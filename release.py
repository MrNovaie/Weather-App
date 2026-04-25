"""Heroku release phase: ensure database tables exist."""
from app import app, db


def main():
    with app.app_context():
        db.create_all()
    print("Database tables ensured.")


if __name__ == "__main__":
    main()
