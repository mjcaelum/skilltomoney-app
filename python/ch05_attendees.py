records = [["AI 자동화", "김하늘"], ["숏폼 편집", "이바다"], ["AI 자동화", "김하늘"], ["AI 자동화", "박봄"]]
attendees = {}
duplicates = []
for i in range(0, len(records), 1):
    course = records[i][0]
    name = records[i][1]
    if course not in attendees:
        attendees[course] = []
    if name in attendees[course]:
        duplicates.append(records[i])
    else:
        attendees[course].append(name)
print("강좌별 명단:", attendees)
print("중복 신청:", duplicates)
