import psycopg2

DB_URI = "postgresql://readonly_user1:WordWave126@ep-soft-frog-a9mom2b2-pooler.gwc.azure.neon.tech/neondb?sslmode=require"

def test_query(word):
    try:
        # 连接到数据库
        conn = psycopg2.connect(DB_URI)
        cursor = conn.cursor()

        # 查询单词
        cursor.execute("SELECT * FROM words WHERE word = %s", (word,))
        result = cursor.fetchone()

        if result:
            print(f"Word '{word}' found in database!")
        else:
            print(f"Word '{word}' not found in database!")

    except Exception as e:
        print(f"Error querying database: {e}")
    finally:
        # 关闭连接
        if conn:
            cursor.close()
            conn.close()

# 测试查询
test_query("no")  # 替换为你想查询的单词
