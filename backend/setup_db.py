import os
import psycopg2
from psycopg2 import sql
from dotenv import load_dotenv

def setup_database():
    # Load environment variables from .env
    load_dotenv()
    
    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("Error: DATABASE_URL not found in .env file")
        return

    print(f"Connecting to database: {database_url.split('@')[-1]}") # Print host/db without password
    
    try:
        # Connect to the database
        conn = psycopg2.connect(database_url)
        conn.autocommit = True
        cur = conn.cursor()
        
        # Path to the SQL file
        sql_file_path = os.path.join(os.path.dirname(__file__), "..", "init_postgres_db.sql")
        
        if not os.path.exists(sql_file_path):
            print(f"Error: SQL file not found at {sql_file_path}")
            return

        print(f"Reading SQL script from {sql_file_path}...")
        with open(sql_file_path, "r") as f:
            sql_script = f.read()

        print("Executing SQL initialization script...")
        # Execute the script
        # Note: Psycopg2 cursor.execute() can execute multiple statements separated by semicolons
        cur.execute(sql_script)
        
        print("\nSUCCESS: Database initialized thoroughly!")
        print("Initial users created:")
        print("  - Admin: admin@dtcy.com / password123")
        print("  - Faculty: faculty@dtcy.com / password123")
        print("  - Student: student@dtcy.com / password123")
        
        cur.close()
        conn.close()
        
    except Exception as e:
        print(f"\nFAILED to initialize database: {e}")

if __name__ == "__main__":
    setup_database()
