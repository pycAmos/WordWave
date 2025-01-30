from flask import Flask, render_template, jsonify, request
from flask_cors import CORS
from database import is_valid_word  # 从 database.py 导入

# 初始化 Flask 应用
app = Flask(__name__, static_folder='../assets', template_folder='../templates')
# 允许所有域进行跨域请求
CORS(app)

# 根路径 "/"：显示 main.html 页面
@app.route('/')
def home():
    return render_template('main.html')

# "/game" 路径：显示 game.html 页面
@app.route('/game')
def game():
    return render_template('game.html')

# "/validate" 路径：检查单词有效性
@app.route('/validate', methods=['GET'])
def validate_word():
    """
    检查单词是否有效的 API 路由。
    请求参数：?word=<单词>
    """
    word = request.args.get('word', '').strip()

    # 检查请求中是否提供了单词
    if not word:
        return jsonify({"error": "No word provided"}), 400

    # 检查单词有效性
    is_valid = is_valid_word(word)
    return jsonify({"word": word, "is_valid": is_valid})

# 主程序入口
if __name__ == "__main__":
    app.run(host='0.0.0.0', port=5000)
