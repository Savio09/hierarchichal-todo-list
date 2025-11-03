#!/usr/bin/env python3
"""
Quick database initialization script
This will create all tables in your PostgreSQL database
"""
import sys
import os

# Add the backend directory to the path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import app, db
from models import User, List, Task


def init_database():
    """Initialize the database with all tables"""
    with app.app_context():
        try:
            print("🔍 Checking database connection...")
            print(
                f"📊 Database: {app.config.get('SQLALCHEMY_DATABASE_URI', 'Not set')[:50]}..."
            )

            print("\n📋 Creating tables...")
            db.create_all()

            print("\n✅ SUCCESS! All tables created:")
            print("   ✓ users")
            print("   ✓ lists")
            print("   ✓ tasks")

            print("\n🎉 Your database is ready!")
            print("💡 You can now:")
            print("   1. Start your Flask server: python3 app.py")
            print("   2. Register a new user in the frontend")
            print("   3. Create lists and tasks")

        except Exception as e:
            print(f"\n❌ Error creating tables: {e}")
            print("\n🔧 Troubleshooting:")
            print("   1. Check your DATABASE_URL in .env")
            print("   2. Make sure PostgreSQL database exists")
            print("   3. Verify database credentials are correct")
            sys.exit(1)


if __name__ == "__main__":
    init_database()
