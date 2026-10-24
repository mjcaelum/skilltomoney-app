people = int(input("신청 인원: "))
books = (people + 4) // 5
water = (people + 5) // 6
total = books * 12000 + water * 3000
print("교재", books, "묶음")
print("생수", water, "묶음")
print("준비 비용", total, "원")
