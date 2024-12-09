from psycopg2.pool import SimpleConnectionPool

# 数据库连接信息
DB_URI = "postgres://postgres:2c32df78381f2d250eec67f742622fd7@172.23.66.238:52031/team_project_4_db"

# 初始化连接池
pool = SimpleConnectionPool(1, 20, DB_URI)  # 最小1个连接，最大20个连接

def get_db_connection():
    """
    获取一个数据库连接。
    """
    return pool.getconn()

def release_db_connection(conn):
    """
    释放数据库连接回连接池。
    """
    pool.putconn(conn)

def is_valid_word(word):
    """
    检查单词是否在数据库中有效。
    """
    conn = None
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT EXISTS (SELECT 1 FROM words WHERE word = %s)", (word.lower(),))
        result = cursor.fetchone()
        return result[0]
    except Exception as e:
        print(f"Error checking word '{word}': {e}")
        return False
    finally:
        if conn:
            release_db_connection(conn)
