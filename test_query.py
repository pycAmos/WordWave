import psycopg2

DB_URI = "postgres://postgres:2c32df78381f2d250eec67f742622fd7@172.23.66.238:52031/team_project_4_db"

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
