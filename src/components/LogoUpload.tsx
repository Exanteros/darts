"use client";

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface LogoUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
  type: 'mainLogo' | 'sponsorLogo' | 'backgroundImage';
  accept?: string;
  multiple?: boolean;
  onMultipleChange?: (urls: string[]) => void;
  multipleValues?: string[];
}

export function LogoUpload({ label, value, onChange, type, accept = "image/*", multiple = false, onMultipleChange, multipleValues = [] }: LogoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Datei zu groß",
        description: "Die Datei darf maximal 5MB groß sein.",
        variant: "destructive",
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Ungültiger Dateityp",
        description: "Bitte wählen Sie eine Bilddatei aus.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Upload fehlgeschlagen');
      }

      const result = await response.json();
      onChange(result.url);

      toast({
        title: "Upload erfolgreich",
        description: `${label} wurde erfolgreich hochgeladen.`,
      });
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: "Upload fehlgeschlagen",
        description: "Beim Hochladen ist ein Fehler aufgetreten.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemove = () => {
    onChange('');
    toast({
      title: "Logo entfernt",
      description: `${label} wurde entfernt.`,
    });
  };

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex items-center gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Lädt hoch...' : 'Hochladen'}
        </Button>

        {value && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleRemove}
            className="flex items-center gap-2 text-destructive hover:text-destructive"
          >
            <X className="h-4 w-4" />
            Entfernen
          </Button>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept={accept}
          onChange={handleFileSelect}
          className="hidden"
        />
      </div>

      {value && (
        <div className="mt-4">
          <div className="relative inline-block">
            <img
              src={value}
              alt={label}
              className="max-w-32 max-h-32 object-contain border rounded-lg"
            />
          </div>
        </div>
      )}

      {!value && (
        <div className="mt-4 p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Kein {label.toLowerCase()} ausgewählt
          </p>
        </div>
      )}
    </div>
  );
}

interface SponsorLogosUploadProps {
  label: string;
  values: string[];
  onChange: (urls: string[]) => void;
}

export function SponsorLogosUpload({ label, values, onChange }: SponsorLogosUploadProps) {
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    // Validate files
    for (const file of files) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "Datei zu groß",
          description: `${file.name} ist größer als 5MB.`,
          variant: "destructive",
        });
        return;
      }

      if (!file.type.startsWith('image/')) {
        toast({
          title: "Ungültiger Dateityp",
          description: `${file.name} ist keine Bilddatei.`,
          variant: "destructive",
        });
        return;
      }
    }

    setUploading(true);
    let successCount = 0;
    let failCount = 0;
    const newUrls: string[] = [];

    await Promise.all(files.map(async (file) => {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('type', 'sponsorLogo');

        const response = await fetch('/api/admin/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed for ${file.name}`);
        }

        const result = await response.json();
        newUrls.push(result.url);
        successCount++;
      } catch (error) {
        console.error(`Error uploading ${file.name}:`, error);
        failCount++;
      }
    }));

    if (newUrls.length > 0) {
      const newValues = [...values, ...newUrls];
      onChange(newValues);
    }

    setUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }

    if (successCount > 0) {
      toast({
        title: "Upload abgeschlossen",
        description: `${successCount} Logo(s) erfolgreich hochgeladen.${failCount > 0 ? ` ${failCount} fehlgeschlagen.` : ''}`,
        variant: failCount > 0 ? "default" : "default", // or "warning" if available
      });
    } else if (failCount > 0) {
      toast({
        title: "Upload fehlgeschlagen",
        description: "Alle Uploads sind fehlgeschlagen.",
        variant: "destructive",
      });
    }
  };

  const handleRemove = (index: number) => {
    const newValues = values.filter((_, i) => i !== index);
    onChange(newValues);
    toast({
      title: "Logo entfernt",
      description: "Sponsor-Logo wurde entfernt.",
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>{label}</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2"
        >
          <Upload className="h-4 w-4" />
          {uploading ? 'Lädt hoch...' : 'Hinzufügen'}
        </Button>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {values.length === 0 ? (
        <div className="p-8 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <ImageIcon className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground">
            Keine Sponsor-Logos hochgeladen
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Klicken Sie auf "Hinzufügen" um mehrere Logos auszuwählen
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {values.map((url, index) => (
            <div key={index} className="relative group">
              <img
                src={url}
                alt={`Sponsor ${index + 1}`}
                className="w-full h-24 object-contain border rounded-lg bg-white"
              />
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={() => handleRemove(index)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
