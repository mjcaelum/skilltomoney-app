month = 11
day = 7
lesson = 0
while lesson < 7:
    if month == 12 and day == 19:
        print(month, "월", day, "일 (휴무)")
    else:
        lesson = lesson + 1
        print(lesson, "회차:", month, "월", day, "일")
    day = day + 7
    if month == 11 and day > 30:
        month = 12
        day = day - 30
    elif month == 12 and day > 31:
        month = 1
        day = day - 31
