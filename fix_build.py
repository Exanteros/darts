import re

with open("src/app/api/dashboard/tournament/game/[gameId]/stats/route.ts", "r") as f:
    c1 = f.read()
c1 = c1.replace("@/lib/db", "@/lib/prisma")
with open("src/app/api/dashboard/tournament/game/[gameId]/stats/route.ts", "w") as f:
    f.write(c1)

with open("src/app/api/dashboard/tournament/game/[gameId]/stats/highlights/route.ts", "r") as f:
    c2 = f.read()
c2 = c2.replace("@/lib/db", "@/lib/prisma")
with open("src/app/api/dashboard/tournament/game/[gameId]/stats/highlights/route.ts", "w") as f:
    f.write(c2)

with open("src/app/dashboard/tournament/bracket/page.tsx", "r") as f:
    c3 = f.read()
c3 = c3.replace("ShieldAlert\n  Camera,", "ShieldAlert,\n  Camera,")
with open("src/app/dashboard/tournament/bracket/page.tsx", "w") as f:
    f.write(c3)
