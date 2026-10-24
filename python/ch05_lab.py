courses = [
{"id": 1, "name": "AI 자동화", "price": 35000, "seat": 8, "booked": 8, "tags": ["초보 환영", "2시간"]},
    {"id": 2, "name": "숏폼 편집", "price": 45000, "seat": 6, "booked": 2, "tags": ["캡컷", "3시간"]},
    {"id": 3, "name": "엑셀 실무", "price": 30000, "seat": 10, "booked": 7, "tags": ["함수 실습"]},
    {"id": 4, "name": "스마트스토어", "price": 40000, "seat": 6, "booked": 5, "tags": ["상세페이지", "창업 준비"]}
]
only_open = True
for i in range(0, len(courses), 1):
    c = courses[i]
    left = c["seat"] - c["booked"]
    if only_open and left == 0:
        continue
    print(c["name"], c["price"], "원 / 남은 자리", left, "석", c["tags"])
