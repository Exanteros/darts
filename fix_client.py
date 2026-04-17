with open("src/app/dashboard/tournament/bracket/page.tsx", "r") as f:
    text = f.read()
text = text.replace('import { InstagramCanvas } from "@/components/dashboard/InstagramCanvas";\n// @ts-nocheck\n"use client";', '// @ts-nocheck\n"use client";\nimport { InstagramCanvas } from "@/components/dashboard/InstagramCanvas";')
with open("src/app/dashboard/tournament/bracket/page.tsx", "w") as f:
    f.write(text)
