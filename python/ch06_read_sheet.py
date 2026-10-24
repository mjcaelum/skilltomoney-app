import json
import urllib.request
import urllib.parse
from google.colab import userdata

url = userdata.get("SHEET_URL") + "?" + urllib.parse.urlencode({"key": userdata.get("SHEET_KEY")})
with urllib.request.urlopen(url, timeout=20) as response:
    rows = json.loads(response.read().decode("utf-8"))
if not isinstance(rows, list):
    raise ValueError("장부를 읽지 못했습니다. SHEET_URL과 SHEET_KEY를 확인하세요.")
print("장부에서 예약", len(rows), "건을 읽었습니다.")
people = {}
for i in range(0, len(rows), 1):
    course = rows[i]["course"]
    if course in people:
        people[course] = people[course] + rows[i]["people"]
    else:
        people[course] = rows[i]["people"]
print("강좌별 예약 인원:", people)
print("백업:", json.dumps(rows, ensure_ascii=False))
