"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trophy, Plus, Edit, Trash2, Save, X, GripVertical } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useTournamentAccess } from "@/hooks/useTournamentAccess";

// Minimal TypeScript interfaces for the UI
interface Champion {
  id: string;
  name: string;
  tournament: string;
  date: string;
  avg: string;
  checkout: string;
  tag: string | null;
  imageUrl: string | null;
  imagePosY: string;
  colorClass: string;
  iconColor: string;
  order: number;
}

const COLOR_OPTIONS_BORDER = [
  { value: "bg-amber-400", label: "Gelb", color: "bg-amber-400" },
  { value: "bg-blue-400", label: "Blau", color: "bg-blue-400" },
  { value: "bg-green-400", label: "Grün", color: "bg-green-400" },
  { value: "bg-red-400", label: "Rot", color: "bg-red-400" },
  { value: "bg-slate-400", label: "Grau", color: "bg-slate-400" },
];

const COLOR_OPTIONS_ICON = [
  { value: "text-amber-500", label: "Gelb", color: "bg-amber-500" },
  { value: "text-blue-500", label: "Blau", color: "bg-blue-500" },
  { value: "text-green-500", label: "Grün", color: "bg-green-500" },
  { value: "text-red-500", label: "Rot", color: "bg-red-500" },
  { value: "text-slate-500", label: "Grau", color: "bg-slate-500" },
];

export default function AdminChampionsPage() {
  const { isAdmin, isLoading: loadingAccess } = useTournamentAccess();
  const [champions, setChampions] = useState<Champion[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);
  const [formData, setFormData] = useState<Partial<Champion>>({});
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startPosY, setStartPosY] = useState(50);
  const { toast } = useToast();

  const fetchChampions = async () => {
    try {
      const res = await fetch("/api/admin/tournament/champions");
      if (res.ok) {
        const data = await res.json();
        setChampions(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChampions();
  }, []);

  const handleEdit = (c: Champion) => {
    setEditingId(c.id);
    setFormData(c);
  };

  const handleAddNew = () => {
    setEditingId("new");
    setFormData({
      name: "",
      tournament: "",
      date: "",
      avg: "",
      checkout: "",
      tag: "Sieger",
      imageUrl: null,
      imagePosY: "50%",
      colorClass: "bg-amber-400",
      iconColor: "text-amber-500",
      order: champions.length,
    });
  };

  const handleSave = async () => {
    try {
      const method = editingId === "new" ? "POST" : "PUT";
      const url = editingId === "new" 
        ? "/api/admin/tournament/champions" 
        : `/api/admin/tournament/champions/${editingId}`;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        toast({ title: "Champion gespeichert", description: "Daten erfolgreich aktualisiert." });
        setEditingId(null);
        setFormData({});
        fetchChampions();
      } else {
        throw new Error("Fehler beim Speichern");
      }
    } catch (e: any) {
        toast({ title: "Fehler", description: e.message || "Es ist ein Fehler aufgetreten.", variant: "destructive" });
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      toast({ title: "Lade hoch...", description: "Das Bild wird hochgeladen." });
      const data = new FormData();
      data.append("file", file);

      const res = await fetch("/api/admin/tournament/champions/upload", {
        method: "POST",
        body: data,
      });

      if (res.ok) {
        const json = await res.json();
        setFormData(prev => ({ ...prev, imageUrl: json.url }));
        toast({ title: "Erfolgreich", description: "Bild hochgeladen." });
      } else {
        throw new Error("Fehler beim Hochladen");
      }
    } catch (error) {
      console.error(error);
      toast({ title: "Fehler", description: "Konnte Bild nicht hochladen", variant: "destructive" });
    }
  };

  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setStartY(clientY);
    const currentPos = parseInt((formData.imagePosY || "50%").replace("%", ""));
    setStartPosY(isNaN(currentPos) ? 50 : currentPos);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const deltaY = clientY - startY;
    
    // Sensitivity factor - smaller number = slower movement
    const sensitivity = 0.5;
    
    // Calculate new position (-deltaY because moving mouse up should move image down, which is a higher percentage)
    let newPos = startPosY - (deltaY * sensitivity);
    
    // Clamp between 0 and 100
    newPos = Math.max(0, Math.min(100, newPos));
    
    setFormData(prev => ({ 
      ...prev, 
      imagePosY: `${Math.round(newPos)}%` 
    }));
  };

  const handleDragEnd = () => {
    setIsDragging(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Diesen Champion wirklich löschen?")) return;
    
    try {
      const res = await fetch(`/api/admin/tournament/champions/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        toast({ title: "Gelöscht", description: "Champion wurde gelöscht." });
        fetchChampions();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  }

  // Helper inputs rendered as a simple function to avoid unmounting on re-render
  const renderInputRow = (label: string, field: string, placeholder?: string) => (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input
        placeholder={placeholder}
        value={(formData as any)[field] || ""}
        onChange={e => setFormData({ ...formData, [field]: e.target.value })}
      />
    </div>
  );

  if (loadingAccess) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  if (!isAdmin) {
    return (
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-red-500 font-bold">Zugriff verweigert</div>
          </div>
        </SidebarInset>
      </SidebarProvider>
    );
  }

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <SiteHeader />
        <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto w-full font-sans">
          <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Hall of Fame anpassen</h1>
              <p className="text-slate-500">Verwalte die Champions, die auf der öffentlichen Seite angezeigt werden.</p>
            </div>
            <Button onClick={handleAddNew} className="bg-slate-900 text-white hover:bg-slate-800 shrink-0" disabled={editingId !== null}>
               <Plus className="mr-2 h-4 w-4" />
               Neuer Champion
            </Button>
          </div>

          {loading ? (
            <div className="text-slate-500 animate-pulse">Lade Champions...</div>
          ) : (
            <div className="space-y-4">
          
          {editingId === "new" && (
            <Card className="shadow-sm border-gray-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-amber-600 flex items-center gap-2">
                  <Trophy size={20} />
                  Neuen Champion anlegen
                </CardTitle>
                <CardDescription>
                   Füge einen neuen Gewinner zur öffentlichen Hall of Fame hinzu.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {renderInputRow("Spielername", "name", "z.B. Max Mustermann")}
                  {renderInputRow("Turnier-Name", "tournament", "z.B. Summer Open 2025")}
                  {renderInputRow("Datum", "date", "z.B. 15. August 2025")}
                  {renderInputRow("Tag (optional)", "tag", "z.B. Reigning Champ oder Sieger")}
                  {renderInputRow("Turnier-Average", "avg", "z.B. 85.4")}
                  {renderInputRow("High Finish", "checkout", "z.B. 170")}
                  
                  <div className="grid gap-2 w-full md:col-span-2">
                    <Label>Profil-/Panoramabild</Label>
                    <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                      {formData.imageUrl && (
                        <div className="flex flex-col gap-2">
                          <div 
                              className="relative h-20 w-44 bg-slate-100 rounded bg-cover border shadow-sm cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-amber-500 hover:ring-offset-1 transition-shadow" 
                              style={{ 
                                  backgroundImage: `url(${formData.imageUrl})`,
                                  backgroundPosition: `center ${formData.imagePosY || "50%"}`
                              }}
                              onMouseDown={handleDragStart}
                              onMouseMove={handleDragMove}
                              onMouseUp={handleDragEnd}
                              onMouseLeave={handleDragEnd}
                              onTouchStart={handleDragStart}
                              onTouchMove={handleDragMove}
                              onTouchEnd={handleDragEnd}
                          >
                              <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity rounded">
                                 <GripVertical className="text-white" />
                              </div>
                          </div>
                          <div className="text-xs text-slate-500 flex items-center gap-1 font-medium justify-center">
                             <span>Ausrichtung Y:</span> <span className="font-mono">{formData.imagePosY || "50%"}</span>
                          </div>
                        </div>
                      )}
                      <Input type="file" accept="image/*" onChange={handleImageUpload} className={formData.imageUrl ? "w-auto" : "w-full"} />
                    </div>
                  </div>

                  {/* Color Pickers Fallbacks */}
                  <div className="grid gap-2 w-full">
                    <Label>Farbe Rand (Tailwind)</Label>
                    <Select 
                        value={formData.colorClass || "bg-amber-400"}
                        onValueChange={(value) => setFormData({ ...formData, colorClass: value })}
                    >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Farbe wählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {COLOR_OPTIONS_BORDER.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-sm ${opt.color}`}></div>
                                        <span>{opt.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="grid gap-2 w-full">
                     <Label>Farbe Icon (Tailwind)</Label>
                     <Select 
                        value={formData.iconColor || "text-amber-500"}
                        onValueChange={(value) => setFormData({ ...formData, iconColor: value })}
                     >
                        <SelectTrigger className="w-full">
                            <SelectValue placeholder="Farbe wählen" />
                        </SelectTrigger>
                        <SelectContent>
                            {COLOR_OPTIONS_ICON.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-4 h-4 rounded-sm ${opt.color}`}></div>
                                        <span>{opt.label}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex gap-2 justify-end">
                <Button variant="outline" onClick={cancelEdit}>Abbrechen</Button>
                <Button onClick={handleSave} className="bg-slate-900 text-white"><Save className="mr-2 h-4 w-4"/> Speichern</Button>
              </CardFooter>
            </Card>
          )}

          {champions.length === 0 && editingId !== "new" && (
            <div className="p-12 text-center border-2 border-dashed border-slate-200 rounded-lg text-slate-500">
               Noch keine Champions angelegt.
            </div>
          )}

          {champions.map((c) => (
            <div key={c.id}>
              {editingId === c.id ? (
                <Card className="shadow-sm border-gray-200 mb-4">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-blue-600 flex items-center gap-2">
                        <Edit size={20} />
                        Champion bearbeiten
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      {renderInputRow("Spielername", "name")}
                      {renderInputRow("Turnier-Name", "tournament")}
                      {renderInputRow("Datum", "date")}
                      {renderInputRow("Tag (optional)", "tag")}
                      {renderInputRow("Turnier-Average", "avg")}
                      {renderInputRow("High Finish", "checkout")}
                      
                      <div className="grid gap-2 w-full md:col-span-2">
                        <Label>Profil-/Panoramabild</Label>
                        <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                          {formData.imageUrl && (
                            <div className="flex flex-col gap-2">
                              <div 
                                  className="relative h-20 w-44 bg-slate-100 rounded bg-cover border shadow-sm cursor-grab active:cursor-grabbing hover:ring-2 hover:ring-blue-500 hover:ring-offset-1 transition-shadow" 
                                  style={{ 
                                      backgroundImage: `url(${formData.imageUrl})`,
                                      backgroundPosition: `center ${formData.imagePosY || "50%"}`
                                  }}
                                  onMouseDown={handleDragStart}
                                  onMouseMove={handleDragMove}
                                  onMouseUp={handleDragEnd}
                                  onMouseLeave={handleDragEnd}
                                  onTouchStart={handleDragStart}
                                  onTouchMove={handleDragMove}
                                  onTouchEnd={handleDragEnd}
                              >
                                  <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/30 transition-opacity rounded">
                                     <GripVertical className="text-white" />
                                  </div>
                              </div>
                              <div className="text-xs text-slate-500 flex items-center gap-1 font-medium justify-center">
                                 <span>Ausrichtung Y:</span> <span className="font-mono">{formData.imagePosY || "50%"}</span>
                              </div>
                            </div>
                          )}
                          <Input type="file" accept="image/*" onChange={handleImageUpload} className={formData.imageUrl ? "w-auto" : "w-full"} />
                        </div>
                      </div>

                       {/* Color Pickers Fallbacks */}
                       <div className="grid gap-2 w-full">
                          <Label>Farbe Rand (Tailwind)</Label>
                          <Select 
                              value={formData.colorClass || "bg-amber-400"}
                              onValueChange={(value) => setFormData({ ...formData, colorClass: value })}
                          >
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Farbe wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                  {COLOR_OPTIONS_BORDER.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                          <div className="flex items-center gap-2">
                                              <div className={`w-4 h-4 rounded-sm ${opt.color}`}></div>
                                              <span>{opt.label}</span>
                                          </div>
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                      
                      <div className="grid gap-2 w-full">
                          <Label>Farbe Icon (Tailwind)</Label>
                          <Select 
                              value={formData.iconColor || "text-amber-500"}
                              onValueChange={(value) => setFormData({ ...formData, iconColor: value })}
                          >
                              <SelectTrigger className="w-full">
                                  <SelectValue placeholder="Farbe wählen" />
                              </SelectTrigger>
                              <SelectContent>
                                  {COLOR_OPTIONS_ICON.map((opt) => (
                                      <SelectItem key={opt.value} value={opt.value}>
                                          <div className="flex items-center gap-2">
                                              <div className={`w-4 h-4 rounded-sm ${opt.color}`}></div>
                                              <span>{opt.label}</span>
                                          </div>
                                      </SelectItem>
                                  ))}
                              </SelectContent>
                          </Select>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 justify-end">
                      <Button variant="outline" onClick={cancelEdit}>Abbrechen</Button>
                      <Button onClick={handleSave} className="bg-slate-900 text-white"><Save className="mr-2 h-4 w-4"/> Speichern</Button>
                  </CardFooter>
                </Card>
              ) : (
                <div className="bg-white border gap-4 border-slate-200 p-4 rounded-lg flex items-center justify-between hover:shadow-sm transition-shadow">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-sm bg-slate-100 flex items-center justify-center border-b-2 ${c.colorClass}`}>
                      <Trophy className={c.iconColor} size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-lg text-slate-900">{c.name}</div>
                      <div className="text-xs font-sans text-slate-500 uppercase tracking-wider">{c.tournament} • {c.date}</div>
                    </div>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(c)} disabled={editingId !== null}>
                       <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => handleDelete(c.id)} disabled={editingId !== null}>
                       <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

        </div>
      )}

        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}