"use client";

import { useTournamentAccess } from '@/hooks/useTournamentAccess';
import { AppSidebar } from "@/components/app-sidebar"
import { SiteHeader } from "@/components/site-header"
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar"
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';

function UploadedImagesList() {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; imageUrl: string | null }>({ open: false, imageUrl: null });
  const { toast } = useToast();

  const fetchImages = async () => {
    try {
      const response = await fetch('/api/admin/uploaded-images');
      if (response.ok) {
        const data = await response.json();
        setImages(data.images);
      }
    } catch (error) {
      console.error('Error fetching images:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchImages();
  }, []);

  const handleDeleteImage = async () => {
    if (!deleteDialog.imageUrl) return;

    try {
      const response = await fetch('/api/admin/uploaded-images', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrl: deleteDialog.imageUrl }),
      });

      if (response.ok) {
        toast({
          title: "Bild gelöscht",
          description: "Das Bild wurde erfolgreich gelöscht.",
        });
        fetchImages(); // Liste neu laden
      } else {
        const errorData = await response.json();
        toast({
          title: "Fehler beim Löschen",
          description: errorData.message || "Das Bild konnte nicht gelöscht werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Fehler beim Löschen des Bildes.",
        variant: "destructive",
      });
    } finally {
      setDeleteDialog({ open: false, imageUrl: null });
    }
  };

  if (loading) {
    return <div className="text-center py-4">Lade Bilder...</div>;
  }

  if (images.length === 0) {
    return <div className="text-center py-4 text-muted-foreground">Keine Bilder hochgeladen</div>;
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {images.map((imageUrl, index) => (
          <div key={index} className="relative group">
            <img
              src={imageUrl}
              alt={`Hochgeladenes Bild ${index + 1}`}
              className="w-full h-24 object-cover rounded-lg border"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
              <div className="flex flex-col items-center gap-2">
                <span className="text-white text-xs text-center px-2">
                  {imageUrl.split('/').pop()}
                </span>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => setDeleteDialog({ open: true, imageUrl })}
                  className="h-6 px-2 text-xs"
                >
                  Löschen
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Dialog open={deleteDialog.open} onOpenChange={(open) => setDeleteDialog({ open, imageUrl: null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bild löschen</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              Sind Sie sicher, dass Sie dieses Bild löschen möchten?
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Datei: {deleteDialog.imageUrl?.split('/').pop()}
            </p>
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialog({ open: false, imageUrl: null })}
            >
              Abbrechen
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteImage}
            >
              Löschen
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default function TournamentImagesPage() {
  const { isAdmin, tournamentAccess, isLoading, isAuthenticated } = useTournamentAccess();

  const canManageTournaments = isAdmin || tournamentAccess.some(access => {
    const permissions = JSON.parse(access.permissions || '{}');
    return permissions.games?.create === true || permissions.bracket?.edit === true;
  });

  if (isLoading) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAuthenticated || (!isAdmin && !canManageTournaments)) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center">
              <h1 className="text-2xl font-bold mb-4">Zugriff verweigert</h1>
              <p className="text-muted-foreground">Sie haben keine Berechtigung für diese Seite.</p>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Hochgeladene Bilder</h1>
                    <p className="text-muted-foreground">
                      Alle bereits hochgeladenen Bilder in der Galerie
                    </p>
                  </div>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>Hochgeladene Bilder</CardTitle>
                    <CardDescription>
                      Alle bereits hochgeladenen Bilder in der Galerie
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <UploadedImagesList />
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}