import json
prices = {"AI 자동화": 35000, "숏폼 편집": 45000, "엑셀 실무": 30000}
rsv = {"date": "2026-11-07", "course": "AI 자동화", "name": input("이름: "), "phone": "010-1111-2222", "people": int(input("인원: "))}
rsv["total"] = prices[rsv["course"]] * rsv["people"]
text = json.dumps(rsv, ensure_ascii=False)
print("보내는 JSON:", text)

data = json.loads(text)
keys = ["date", "course", "name", "phone", "people", "total"]
row = []
for i in range(0, len(keys), 1):
    row.append(data[keys[i]])
print("시트에 추가되는 행:", row)
