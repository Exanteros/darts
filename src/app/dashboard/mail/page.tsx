"use client"

import { useState, useEffect } from "react"
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { LoadingButton } from "@/components/ui/loading-button"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { IconMail, IconTemplate, IconSend, IconEdit, IconEye, IconTrash } from "@tabler/icons-react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog'
// DOMPurify and marked are browser-only; import them dynamically in event handlers to avoid
// server-side bundling / prerender issues (jsdom errors during build).
import { AppSidebar } from "@/components/app-sidebar"
import { SidebarInset, SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar"
import { SiteHeader } from "@/components/site-header"
import { useToast } from "@/hooks/use-toast"

interface Template {
  id: string;
  name: string;
  subject: string;
  content: string;
  lastModified: string;
  description: string;
}

export default function MailPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isSending, setIsSending] = useState(false)
  const [recipientType, setRecipientType] = useState("all")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [batchSize, setBatchSize] = useState<number>(50)
  const [retries, setRetries] = useState<number>(2)
  const [batchDelayMs, setBatchDelayMs] = useState<number>(500)
  const [activeTab, setActiveTab] = useState("compose")
  const [previewHtml, setPreviewHtml] = useState<string | null>(null)
  const [previewSubject, setPreviewSubject] = useState<string | null>(null)
  const [previewOpen, setPreviewOpen] = useState(false)
  const [sendResult, setSendResult] = useState<{ sent: number, failed: number, count: number } | null>(null)
  const [editorOpen, setEditorOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [editorName, setEditorName] = useState('')
  const [editorSubject, setEditorSubject] = useState('')
  const [editorContent, setEditorContent] = useState('')
  const [editorDescription, setEditorDescription] = useState('')
  const { toast } = useToast()
  
  // SMTP Test State
  const [testEmail, setTestEmail] = useState("")
  const [testSubject, setTestSubject] = useState("SMTP Test E-Mail")
  const [testMessage, setTestMessage] = useState("Dies ist eine Test-E-Mail vom Darts Tournament System.")
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [deletingTemplate, setDeletingTemplate] = useState<string | null>(null)
  const [smtpSettings, setSmtpSettings] = useState({
    host: "",
    port: "",
    user: "",
    from: ""
  })
  const [loadingSettings, setLoadingSettings] = useState(true)

  useEffect(() => {
    // Clear previous send results when ongoing form changes
    setSendResult(null)
  }, [subject, message, recipientType])

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const response = await fetch('/api/admin/mail/templates');
        if (response.ok) {
          const data = await response.json();
          setTemplates(data);
        }
      } catch (error) {
        console.error("Failed to fetch templates", error);
      }
    };
    fetchTemplates();
    
    const loadSmtpSettings = async () => {
      try {
        const response = await fetch('/api/admin/mail/settings', {
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          setSmtpSettings({
            host: data.host || "",
            port: data.port || "",
            user: data.user || "",
            from: data.from || ""
          });
        } else {
          console.error('Failed to load SMTP settings:', response.status);
        }
      } catch (error) {
        console.error('Error loading SMTP settings:', error);
      } finally {
        setLoadingSettings(false);
      }
    };
    loadSmtpSettings();
  }, []);

  useEffect(() => {
    if (editingTemplate) {
      setEditorName(editingTemplate.name || '');
      setEditorSubject(editingTemplate.subject || '');
      setEditorContent(editingTemplate.content || '');
      setEditorDescription(editingTemplate.description || '');
    } else {
      setEditorName(''); setEditorSubject(''); setEditorContent(''); setEditorDescription('');
    }
  }, [editingTemplate]);

  // Template CRUD
  const createTemplate = async (payload: { name: string, subject: string, content: string, description?: string }) => {
    const response = await fetch('/api/admin/mail/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const t = await response.json();
      setTemplates(prev => [t.template, ...prev]);
      toast({ title: 'Vorlage erstellt', description: 'Die Vorlage wurde erfolgreich gespeichert.' });
      return t.template;
    }
    const err = await response.json();
    toast({ title: 'Fehler', description: err.error || 'Die Vorlage konnte nicht erstellt werden.', variant: 'destructive' });
    return null;
  };

  const updateTemplate = async (id: string, payload: { name: string, subject: string, content: string, description?: string }) => {
    const response = await fetch(`/api/admin/mail/templates/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (response.ok) {
      const r = await response.json();
      setTemplates(prev => prev.map(t => (t.id === id ? r.template : t)));
      toast({ title: 'Vorlage aktualisiert', description: 'Die Vorlage wurde erfolgreich aktualisiert.' });
      return r.template;
    }
    const err = await response.json();
    toast({ title: 'Fehler', description: err.error || 'Die Vorlage konnte nicht aktualisiert werden.', variant: 'destructive' });
    return null;
  }

  const deleteTemplate = async (id: string) => {
    setDeletingTemplate(id);
    try {
      const response = await fetch(`/api/admin/mail/templates/${id}`, { method: 'DELETE' });
      if (response.ok) {
        setTemplates(prev => prev.filter(t => t.id !== id));
        toast({ title: 'Vorlage gelöscht', description: 'Die Vorlage wurde gelöscht.' });
        return true;
      }
      const err = await response.json();
      toast({ title: 'Fehler', description: err.error || 'Die Vorlage konnte nicht gelöscht werden.', variant: 'destructive' });
      return false;
    } finally {
      setDeletingTemplate(null);
    }
  }

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSending(true)
    
    try {
      const response = await fetch('/api/admin/mail/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          recipientType,
          subject,
          message,
          html: message, // currently we keep HTML same as message, can be extended
          batchSize,
          retries,
          batchDelayMs
        }),
      });

      const data = await response.json();

      if (response.ok) {
        toast({
          title: "E-Mail versendet",
          description: data.message || `E-Mails: ${data.sent}/${data.count} gesendet, ${data.failed} fehlgeschlagen.`,
        });
        setSendResult({ sent: data.sent || 0, failed: data.failed || 0, count: data.count || 0 });
        // Reset form
        setSubject("");
        setMessage("");
      } else {
        toast({
          title: "Fehler",
          description: data.error || "Beim Senden ist ein Fehler aufgetreten.",
          variant: "destructive",
        });
        setSendResult(null);
      }
    } catch (error) {
      toast({
        title: "Netzwerkfehler",
        description: "Die Anfrage konnte nicht gesendet werden.",
        variant: "destructive",
      });
    } finally {
      setIsSending(false)
    }
  }

  const handleUseTemplate = (template: Template) => {
    setSubject(template.subject);
    setMessage(template.content);
    setActiveTab("compose");
    toast({
      title: "Vorlage geladen",
      description: `Die Vorlage "${template.name}" wurde in den Editor geladen.`,
    });
  };

  const openCreateTemplate = () => { setEditingTemplate(null); setEditorOpen(true); };
  const openEditTemplate = (template: Template) => { setEditingTemplate(template); setEditorOpen(true); };

  const handleSaveTemplate = async () => {
    if (!editorName || !editorSubject || !editorContent) {
      toast({ title: 'Fehler', description: 'Name, Betreff und Inhalt sind erforderlich.', variant: 'destructive' });
      return;
    }
    setSavingTemplate(true);
    try {
      if (editingTemplate) {
        const updated = await updateTemplate(editingTemplate.id, { name: editorName, subject: editorSubject, content: editorContent, description: editorDescription });
        if (updated) setEditingTemplate(updated);
      } else {
        const created = await createTemplate({ name: editorName, subject: editorSubject, content: editorContent, description: editorDescription });
        if (created) setEditingTemplate(created);
      }
      setEditorOpen(false);
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleTestEmail = async () => {
    if (!testEmail) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie eine Test-E-Mail-Adresse ein.",
        variant: "destructive",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const response = await fetch('/api/admin/mail/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          to: testEmail,
          subject: testSubject,
          text: testMessage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setTestResult({
          success: true,
          message: data.message || 'Test-E-Mail erfolgreich versendet!'
        });
        toast({
          title: "Erfolg",
          description: "Test-E-Mail wurde erfolgreich versendet!",
        });
      } else {
        setTestResult({
          success: false,
          message: data.error || 'Fehler beim Versenden der Test-E-Mail'
        });
        toast({
          title: "Fehler",
          description: data.error || "Test-E-Mail konnte nicht versendet werden.",
          variant: "destructive",
        });
      }
    } catch (error) {
      setTestResult({
        success: false,
        message: 'Netzwerkfehler beim Versenden der Test-E-Mail'
      });
      toast({
        title: "Fehler",
        description: "Netzwerkfehler beim Versenden der Test-E-Mail.",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <SidebarProvider>
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
          <div className="flex items-center justify-between space-y-2 py-4">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">E-Mail Verwaltung</h2>
              <p className="text-muted-foreground">
                Verwaltung von E-Mail-Vorlagen und -Versand
              </p>
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
            <TabsList>
              <TabsTrigger value="compose" className="flex items-center gap-2">
                <IconSend className="h-4 w-4" />
                Nachricht verfassen
              </TabsTrigger>
              <TabsTrigger value="templates" className="flex items-center gap-2">
                <IconTemplate className="h-4 w-4" />
                Vorlagen
              </TabsTrigger>
              <TabsTrigger value="smtp" className="flex items-center gap-2">
                <IconMail className="h-4 w-4" />
                SMTP-Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="compose" className="space-y-4">
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <IconSend className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <CardTitle className="text-base font-semibold">Neue Nachricht</CardTitle>
                      <CardDescription className="text-xs">
                        Nachricht an Teilnehmer oder Gruppen versenden
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6">
                  <form onSubmit={handleSendMail} className="space-y-4">
                    <div className="grid gap-2">
                      <Label htmlFor="recipient">Empfänger</Label>
                      <Select value={recipientType} onValueChange={setRecipientType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Empfänger auswählen" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Alle registrierten Benutzer</SelectItem>
                          <SelectItem value="active">Nur aktive Spieler (im Turnier)</SelectItem>
                          <SelectItem value="admins">Nur Administratoren</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label htmlFor="subject">Betreff</Label>
                      <Input 
                        id="subject" 
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        placeholder="Wichtige Information zum Turnier..." 
                        required 
                      />
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="message">Nachricht</Label>
                      <Textarea 
                        id="message" 
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Schreiben Sie hier Ihre Nachricht..." 
                        className="min-h-[300px]"
                        required
                      />
                      <p className="text-xs text-muted-foreground">
                        Sie können Markdown für die Formatierung verwenden.
                      </p>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                          <Button type="button" variant="outline" size="sm" onClick={async () => {
                            try {
                              const [{ default: DOMPurify }, markedModule] = await Promise.all([
                                import('dompurify'),
                                import('marked')
                              ]);
                              // dompurify exports a factory that needs window; use default sanitize
                              const html = DOMPurify.sanitize(String(markedModule.parse(message || '')));
                              setPreviewHtml(html);
                              setPreviewSubject(subject || null)
                              setPreviewOpen(true);
                            } catch (err) {
                              console.error('Preview generation failed', err);
                              // fallback: plain text
                              setPreviewHtml(String(message || ''));
                              setPreviewSubject(subject || null)
                              setPreviewOpen(true);
                            }
                          }}>
                          <IconEye className="mr-2 h-4 w-4" /> Vorschau
                        </Button>
                        <div>
                          {sendResult && (
                            <div className="text-sm text-muted-foreground">
                              Gesendet: {sendResult.sent} / Fehler: {sendResult.failed} / Gesamt: {sendResult.count}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Batch</Label>
                          <Input type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} className="w-20" />
                          <Label className="text-sm">Retries</Label>
                          <Input type="number" value={retries} onChange={(e) => setRetries(Number(e.target.value))} className="w-20" />
                          <Label className="text-sm">Delay</Label>
                          <Input type="number" value={batchDelayMs} onChange={(e) => setBatchDelayMs(Number(e.target.value))} className="w-24" />
                        </div>
                      </div>
                      <div>
                        <LoadingButton type="submit" loading={isSending} loadingText="Wird gesendet">
                          <IconSend className="mr-2 h-4 w-4" /> Senden
                        </LoadingButton>
                      </div>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="templates" className="space-y-4">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-base font-semibold">Vorlagen</h3>
                  <p className="text-xs text-muted-foreground">
                    {templates.length} Vorlage{templates.length !== 1 ? 'n' : ''} verfügbar
                  </p>
                </div>
                <Button onClick={openCreateTemplate} variant="default" size="lg" className="gap-2">
                  <IconTemplate className="h-5 w-5" />
                  Neue Vorlage
                </Button>
              </div>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <Card key={template.id} className="flex flex-col">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <Badge variant="outline" className="font-mono text-xs">{template.id}</Badge>
                        <span className="text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(template.lastModified).toLocaleDateString('de-DE')}
                        </span>
                      </div>
                      <CardTitle className="text-base font-semibold leading-tight">{template.name}</CardTitle>
                      <CardDescription className="text-xs line-clamp-2">{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-1 pb-3">
                      <div className="rounded-lg border p-3 text-sm">
                        <div className="flex items-start gap-2">
                          <IconMail className="h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground mb-1">Betreff</p>
                            <p className="text-sm font-medium line-clamp-2">{template.subject}</p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="flex flex-col gap-2 border-t pt-4">
                      <div className="grid grid-cols-3 gap-2 w-full">
                        <Button variant="outline" size="sm" className="h-9" onClick={async () => {
                          try {
                            const [{ default: DOMPurify }, markedModule] = await Promise.all([
                              import('dompurify'),
                              import('marked')
                            ]);
                            const html = DOMPurify.sanitize(String(markedModule.parse(template.content || '')));
                            setPreviewHtml(html);
                            setPreviewSubject(template.subject || null);
                            setPreviewOpen(true);
                          } catch (err) {
                            console.error('Template preview failed', err);
                            setPreviewHtml(String(template.content || ''));
                            setPreviewSubject(template.subject || null);
                            setPreviewOpen(true);
                          }
                        }}>
                          <IconEye className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="sm" className="h-9" onClick={() => openEditTemplate(template)}>
                          <IconEdit className="h-4 w-4" />
                        </Button>
                        <LoadingButton 
                          variant="outline" 
                          size="sm" 
                          className="h-9" 
                          onClick={() => deleteTemplate(template.id)}
                          loading={deletingTemplate === template.id}
                        >
                          <IconTrash className="h-4 w-4" />
                        </LoadingButton>
                      </div>
                      <Button 
                        variant="default" 
                        size="sm"
                        className="w-full h-9"
                        onClick={() => handleUseTemplate(template)}
                      >
                        <IconSend className="mr-2 h-4 w-4" /> Verwenden
                      </Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
              {templates.length === 0 && (
                <Card className="p-12 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <IconTemplate className="h-12 w-12 text-muted-foreground" />
                    <div>
                      <h3 className="text-base font-semibold">Keine Vorlagen</h3>
                      <p className="text-xs text-muted-foreground mt-2">
                        Erstellen Sie eine neue Vorlage
                      </p>
                    </div>
                    <Button onClick={openCreateTemplate} variant="default" className="mt-4">
                      <IconTemplate className="mr-2 h-5 w-5" />
                      Erste Vorlage erstellen
                    </Button>
                  </div>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="smtp" className="space-y-4">
              <div className="grid gap-6 md:grid-cols-2">
                {/* SMTP Settings Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <IconMail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base font-semibold">SMTP-Einstellungen</CardTitle>
                        <CardDescription className="text-xs">
                          Aktuelle SMTP-Konfiguration (aus Umgebungsvariablen)
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {loadingSettings ? (
                      <div className="flex items-center justify-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">SMTP Host:</span>
                          <span className="text-sm font-medium">{smtpSettings.host || 'Nicht konfiguriert'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">SMTP Port:</span>
                          <span className="text-sm font-medium">{smtpSettings.port || 'Nicht konfiguriert'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">SMTP User:</span>
                          <span className="text-sm font-medium">{smtpSettings.user || 'Nicht konfiguriert'}</span>
                        </div>
                        <div className="flex justify-between py-2 border-b">
                          <span className="text-sm text-muted-foreground">Von-Adresse:</span>
                          <span className="text-sm font-medium">{smtpSettings.from || 'Nicht konfiguriert'}</span>
                        </div>
                        <div className="pt-2">
                          <p className="text-xs text-muted-foreground">
                            💡 SMTP-Einstellungen werden über Umgebungsvariablen konfiguriert (.env Datei)
                          </p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* SMTP Test Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <IconSend className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <CardTitle className="text-base font-semibold">SMTP-Verbindungstest</CardTitle>
                        <CardDescription className="text-xs">
                          Teste die SMTP-Konfiguration durch Versenden einer Test-E-Mail
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="testEmail">Test-E-Mail-Adresse</Label>
                      <Input
                        id="testEmail"
                        type="email"
                        placeholder="test@example.com"
                        value={testEmail}
                        onChange={(e) => setTestEmail(e.target.value)}
                        disabled={testing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="testSubject">Betreff</Label>
                      <Input
                        id="testSubject"
                        type="text"
                        placeholder="Test-E-Mail Betreff"
                        value={testSubject}
                        onChange={(e) => setTestSubject(e.target.value)}
                        disabled={testing}
                      />
                    </div>
                    <div>
                      <Label htmlFor="testMessage">Nachricht</Label>
                      <Textarea
                        id="testMessage"
                        placeholder="Test-Nachricht..."
                        value={testMessage}
                        onChange={(e) => setTestMessage(e.target.value)}
                        disabled={testing}
                        rows={4}
                      />
                    </div>
                    <LoadingButton 
                      onClick={handleTestEmail} 
                      disabled={!testEmail}
                      className="w-full"
                      loading={testing}
                      loadingText="Sende Test-E-Mail..."
                    >
                      <IconSend className="h-4 w-4 mr-2" />
                      Test-E-Mail senden
                    </LoadingButton>

                    {/* Test Result */}
                    {testResult && (
                      <div className={`p-4 rounded-lg border ${
                        testResult.success 
                          ? 'bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800' 
                          : 'bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800'
                      }`}>
                        <div className="flex items-start gap-2">
                          {testResult.success ? (
                            <span className="text-green-600 dark:text-green-400 text-xl">✓</span>
                          ) : (
                            <span className="text-red-600 dark:text-red-400 text-xl">✗</span>
                          )}
                          <div>
                            <p className={`font-medium ${
                              testResult.success 
                                ? 'text-green-900 dark:text-green-100' 
                                : 'text-red-900 dark:text-red-100'
                            }`}>
                              {testResult.success ? 'Erfolg!' : 'Fehler!'}
                            </p>
                            <p className={`text-sm mt-1 ${
                              testResult.success 
                                ? 'text-green-700 dark:text-green-300' 
                                : 'text-red-700 dark:text-red-300'
                            }`}>
                              {testResult.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Info Card */}
              <Card className="bg-muted/30">
                <CardHeader>
                  <CardTitle className="text-lg">📧 SMTP-Konfiguration</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <p className="text-muted-foreground">
                    Um E-Mails zu versenden, müssen folgende Umgebungsvariablen in der <code className="bg-muted px-1 py-0.5 rounded">.env</code> Datei konfiguriert werden:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground ml-2">
                    <li><code className="bg-muted px-1 py-0.5 rounded">SMTP_HOST</code> - SMTP-Server (z.B. smtp.gmail.com)</li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">SMTP_PORT</code> - SMTP-Port (z.B. 587)</li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">SMTP_USER</code> - SMTP-Benutzername</li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">SMTP_PASS</code> - SMTP-Passwort</li>
                    <li><code className="bg-muted px-1 py-0.5 rounded">SMTP_FROM</code> - Von-Adresse (z.B. noreply@dartsturnier.de)</li>
                  </ul>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
          <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <IconEye className="h-5 w-5" />
                  Email-Vorschau
                </DialogTitle>
              </DialogHeader>
              <div className="max-h-[70vh] overflow-auto rounded-lg border bg-muted/30 p-6">
                {previewSubject && (
                  <div className="mb-6 pb-4 border-b">
                    <p className="text-xs text-muted-foreground mb-1">Betreff:</p>
                    <h3 className="text-xl font-semibold">{previewSubject}</h3>
                  </div>
                )}
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <iframe
                    srcDoc={previewHtml || ''}
                    sandbox="allow-same-origin"
                    className="w-full min-h-[400px] border-0"
                    title="Email Preview"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setPreviewOpen(false)}>Schließen</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingTemplate ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</DialogTitle>
              </DialogHeader>
              <div className="p-4 space-y-3">
                <div className="grid gap-2">
                  <Label htmlFor="tmpl-name">Name</Label>
                  <Input id="tmpl-name" value={editorName} onChange={(e) => setEditorName(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tmpl-subject">Betreff</Label>
                  <Input id="tmpl-subject" value={editorSubject} onChange={(e) => setEditorSubject(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tmpl-content">Inhalt (Markdown)</Label>
                  <Textarea id="tmpl-content" value={editorContent} onChange={(e) => setEditorContent(e.target.value)} className="min-h-[300px]" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="tmpl-desc">Beschreibung</Label>
                  <Input id="tmpl-desc" value={editorDescription} onChange={(e) => setEditorDescription(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <div className="flex items-center justify-end gap-2">
                  <Button variant="outline" onClick={() => setEditorOpen(false)} disabled={savingTemplate}>Abbrechen</Button>
                  <LoadingButton onClick={() => handleSaveTemplate()} loading={savingTemplate} loadingText={editingTemplate ? 'Speichere...' : 'Erstelle...'}>
                    {editingTemplate ? 'Speichern' : 'Erstellen'}
                  </LoadingButton>
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
