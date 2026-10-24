import json

rows = [["2026-11-07", "AI 자동화", "김하늘", 2], ["2026-11-14", "숏폼 편집", "이바다", 1]]
reservations = []
for i in range(0, len(rows), 1):
    row = rows[i]
    reservations.append({"date": row[0], "course": row[1], "name": row[2], "people": row[3]})
backup = json.dumps(reservations, ensure_ascii=False)
print("백업:", backup)
restored = json.loads(backup)
print("두 번째 예약:", restored[1]["name"], restored[1]["people"], "명")
