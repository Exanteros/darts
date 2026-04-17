import re

with open("src/app/dashboard/tournament/bracket/page.tsx", "r") as f:
    content = f.read()

instagram_btn = '''
                  {selectedMatch.status === 'FINISHED' && (
                      <Button 
                          onClick={() => setInstagramDialogOpen(true)}
                          className="flex-1 ml-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      >
                          <Camera className="mr-2 h-4 w-4" />
                          Instagram Share
                      </Button>
                  )}
'''

content = content.replace('''                  {selectedMatch.status === 'WAITING' && (''', instagram_btn + '''                  {selectedMatch.status === 'WAITING' && (''')

instagram_canvas = '''
        {selectedMatch && (
          <InstagramCanvas 
             isOpen={instagramDialogOpen} 
             onClose={() => setInstagramDialogOpen(false)} 
             gameId={selectedMatch.id} 
             tournamentId={tournamentId as string} 
          />
        )}
      </DialogContent>
'''

content = content.replace("</DialogContent>\n        </Dialog>\n      </div>\n    </SidebarInset>", "</DialogContent>\n        </Dialog>\n" + instagram_canvas + "\n      </div>\n    </SidebarInset>")

# add icon import
content = re.sub(r'import {\s*X,\s*AlertCircle,', 'import { X, AlertCircle, Camera,', content)

with open("src/app/dashboard/tournament/bracket/page.tsx", "w") as f:
    f.write(content)
