names = ["AI 자동화", "숏폼 편집", "엑셀 실무"]
prices = [35000, 45000, 30000]
seats = [8, 6, 10]
booked = [8, 2, 7]
for i in range(0, 3, 1):
    left = seats[i] - booked[i]
    if left == 0:
        state = "[마감]"
    elif left <= 2:
        state = "[마감 임박]"
    else:
        state = ""
    print(names[i], prices[i], "원 / 남은 자리", left, "석", state)
