import psycopg2
from dotenv import load_dotenv
import os

# Load environment variables from .env
load_dotenv()

# Fetch variables
USER = os.getenv("user")
PASSWORD = os.getenv("password")
HOST = os.getenv("host")
PORT = os.getenv("port")
DBNAME = os.getenv("dbname")

# Connect to the database
try:
    connection = psycopg2.connect(
        user=USER, password=PASSWORD, host=HOST, port=PORT, dbname=DBNAME
    )
    print("Connection successful!")

    # Create a cursor to execute SQL queries
    cursor = connection.cursor()

    # Example query
    cursor.execute("""
    select table_name
    from information_schema.tables
    where table_schema = 'public';
    """)
    print("Tables in public schema:")
    for row in cursor.fetchall():
        print("-", row[0])

    # For each table, list columns
    for table in ["profiles", "momentos", "likes", "comments", "follows", "collections"]:
        cursor.execute(f"""
            select column_name, data_type
            from information_schema.columns
            where table_schema = 'public' and table_name = %s;
        """, (table,))
        print(f"\nColumns in {table}:")
        for col in cursor.fetchall():
            print(" ", col[0], "-", col[1])

    # Close the cursor and connection
    cursor.close()
    connection.close()
    print("Connection closed.")

except Exception as e:
    print(f"Failed to connect: {e}")
