from flask import Flask, jsonify, request
from flask_cors import CORS
from database import is_valid_word  # 从 database.py 导入

app = Flask(__name__)
CORS(app)

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


if __name__ == "__main__":
    from gunicorn.app.base import BaseApplication

    class GunicornApp(BaseApplication):
        def __init__(self, app, options=None):
            self.app = app
            self.options = options or {}
            super().__init__()

        def load_config(self):
            for key, value in self.options.items():
                self.cfg.set(key.lower(), value)

        def load(self):
            return self.app

    options = {
        "bind": "127.0.0.1:5001",
        "workers": 4,
    }
    GunicornApp(app, options).run()
