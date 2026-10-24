seat = 8
booked = 3
price = 35000
people = int(input("신청 인원: "))
days = int(input("강좌까지 남은 날: "))
if booked + people > seat:
    print("남은 자리는", seat - booked, "석입니다.")
else:
    total = price * people
    if days >= 14:
        total = total - total * 20 // 100
    elif days >= 7:
        total = total - total * 10 // 100
    if people >= 4:
        total = total - 5000
    print("결제 금액:", total, "원")
