"""users 模組冒煙測試（標準庫 unittest，免安裝套件）"""
import os
import sys
import unittest

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from app import users  # noqa: E402


class UsersTest(unittest.TestCase):
    def setUp(self):
        self.conn = users.get_connection(":memory:")
        users.init_schema(self.conn)
        self.conn.execute("INSERT INTO users (name, email) VALUES ('Amy', 'amy@example.com')")

    def tearDown(self):
        self.conn.close()

    def test_find_existing(self):
        self.assertEqual(users.find_user_by_email(self.conn, "amy@example.com")[1], "Amy")

    def test_injection_returns_none(self):
        self.assertIsNone(users.find_user_by_email(self.conn, "' OR '1'='1"))

    def test_empty_email_raises(self):
        with self.assertRaises(ValueError):
            users.find_user_by_email(self.conn, "")


if __name__ == "__main__":
    unittest.main()
