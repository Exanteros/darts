import re
with open("src/app/dashboard/tournament/settings/page.tsx", "r") as f:
    content = f.read()

content = content.replace('''                              <SelectItem 
                                value="ACTIVE">Aktiv</SelectItem>
                                disabled={shootoutStatus ? !shootoutStatus.allCompleted : false}
                                className={shootoutStatus && !shootoutStatus.allCompleted ? "opacity-50 cursor-not-allowed" : ""}
                              >
                                Aktiv {shootoutStatus && !shootoutStatus.allCompleted && `(${shootoutStatus.playersWithShootout}/${shootoutStatus.totalPlayers})`}
                              </SelectItem>''', '                              <SelectItem value="ACTIVE">Aktiv</SelectItem>')

# Fix handleStatusChange
content = re.sub(r'const handleStatusChange = \(value:[^)]+\) => {[^}]+};', 
                 '''const handleStatusChange = (value: 'UPCOMING' | 'REGISTRATION_OPEN' | 'REGISTRATION_CLOSED' | 'SHOOTOUT' | 'ACTIVE' | 'FINISHED' | 'CANCELLED' | 'WAITLIST') => {
      setSettings(prev => ({ ...prev, status: value }));
    };''', content, flags=re.MULTILINE|re.DOTALL)

with open("src/app/dashboard/tournament/settings/page.tsx", "w") as f:
    f.write(content)
