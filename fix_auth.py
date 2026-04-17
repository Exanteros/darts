with open("src/app/api/dashboard/tournament/game/[gameId]/stats/route.ts", "r") as f:
    c1 = f.read()
c1 = c1.replace("@/app/api/auth/[...nextauth]/route", "@/lib/auth")
with open("src/app/api/dashboard/tournament/game/[gameId]/stats/route.ts", "w") as f:
    f.write(c1)

with open("src/app/api/dashboard/tournament/game/[gameId]/stats/highlights/route.ts", "r") as f:
    c2 = f.read()
c2 = c2.replace("@/app/api/auth/[...nextauth]/route", "@/lib/auth")
with open("src/app/api/dashboard/tournament/game/[gameId]/stats/highlights/route.ts", "w") as f:
    f.write(c2)
