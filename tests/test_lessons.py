"""Run with: python -m unittest discover -s tests -p test_*.py"""
import builtins
import contextlib
import io
import json
from pathlib import Path
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parent.parent
RUNNER = (ROOT / "skilltomoney/lab.js").read_text(encoding="utf-8").split("runPythonAsync(`", 1)[1].split("`);", 1)[0]


def run_lab(code, values=()):
    namespace = {"_source": code, "_values_json": json.dumps(list(values))}
    exec(RUNNER, namespace)
    return namespace["_result"]


class Lessons(unittest.TestCase):
    def test_initial_examples(self):
        for chapter, values, expected in [(2, [3], "105000"), (3, [4, 14], "107000"), (4, [], "[마감]"), (5, [], "스마트스토어"), (6, ["김하늘", 2], "70000")]:
            code = (ROOT / f"python/ch{chapter:02}_lab.py").read_text(encoding="utf-8")
            result = run_lab(code, values)
            self.assertTrue(result["ok"], result)
            self.assertIn(expected, result["output"])
            if chapter == 5:
                self.assertNotIn("AI 자동화", result["output"])
            if chapter == 6:
                self.assertEqual(result["variables"]["row"], ["2026-11-07", "AI 자동화", "김하늘", "010-1111-2222", 2, 70000])

    def test_changes_and_error_locations(self):
        result = run_lab('cname="엑셀"\nprice=38000\npeople=int(input("인원수: "))\nprint(price*people)', [3])
        self.assertEqual(result["output"], "114000\n")
        self.assertEqual(result["prompts"], ["인원수: "])
        for code, kind, line in [('x=1\nprint(missing)', "NameError", 2), ('if True\n    pass', "SyntaxError", 1), ('x=int("abc")', "ValueError", 1), ('x="a"+1', "TypeError", 1), ('if True:\nx=1', "IndentationError", 2), ('input()\ninput()', "EOFError", 2), ('import not_a_real_module', "ModuleNotFoundError", 1)]:
            result = run_lab(code, [1])
            self.assertFalse(result["ok"])
            self.assertEqual((result["type"], result["line"]), (kind, line))

    def test_discount_boundaries_and_seats(self):
        code = (ROOT / 'python/ch03_lab.py').read_text(encoding='utf-8')
        for people, days, total in [(3,14,84000),(3,13,94500),(3,7,94500),(3,6,105000),(4,6,135000)]:
            self.assertIn(str(total),run_lab(code,[people,days])["output"])
        self.assertIn('5 석', run_lab(code,[6,14])["output"])

    def test_automation(self):
        for filename, values, expected in [('ch01_promotion.py',[], '#스킬투머니'),('ch02_supplies.py',['8'],'30000'),('ch03_reply.py',['9'],'확인 후 답변드릴게요'),('ch04_schedule.py',[], '7 회차: 12 월 26 일'),('ch05_attendees.py',[], '중복 신청'),('ch06_backup.py',[], '이바다 1 명')]:
            out=io.StringIO()
            with patch.object(builtins,'input',side_effect=values), contextlib.redirect_stdout(out):
                exec((ROOT/'python'/filename).read_text(encoding='utf-8'),{})
            self.assertIn(expected,out.getvalue())


if __name__ == '__main__':
    unittest.main()
