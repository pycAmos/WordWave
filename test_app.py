import unittest
from app import app

class FlaskAppTestCase(unittest.TestCase):
    def setUp(self):
        app.testing = True
        self.app = app.test_client()

    def test_valid_word(self):
        response = self.app.get('/validate?word=ok')  # 修改为 '/validate'
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'word': 'ok', 'is_valid': True})

    def test_invalid_word(self):
        response = self.app.get('/validate?word=invalidword')  # 修改为 '/validate'
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json, {'word': 'invalidword', 'is_valid': False})

    def test_missing_word(self):
        response = self.app.get('/validate')  # 修改为 '/validate'
        self.assertEqual(response.status_code, 400)
        self.assertEqual(response.json, {'error': 'No word provided'})

if __name__ == '__main__':
    unittest.main()
