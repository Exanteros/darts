with open("src/app/dashboard/tournament/bracket/page.tsx", "r") as f:
    content = f.read()

btn = '''
                  {selectedMatch.status === 'FINISHED' && (
                      <Button 
                          onClick={() => setInstagramDialogOpen(true)}
                          className="flex-1 ml-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                      >
                          <Camera className="mr-2 h-4 w-4" />
                          Instagram Share
                      </Button>
                  )}
                  {selectedMatch.status === 'WAITING' && ('''

content = content.replace("                  {selectedMatch.status === 'WAITING' && (", btn)

canvas_modal = '''
        {selectedMatch && (
          <InstagramCanvas 
             isOpen={instagramDialogOpen} 
             onClose={() => setInstagramDialogOpen(false)} 
             gameId={selectedMatch.id} 
             tournamentId={tournamentId as string} 
          />
        )}
      </SidebarInset>
'''

content = content.replace("      </SidebarInset>", canvas_modal)

with open("src/app/dashboard/tournament/bracket/page.tsx", "w") as f:
    f.write(content)
