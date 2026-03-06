'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, Inbox, Reply, User, Trash2, Send } from 'lucide-react';
import { toast } from 'sonner';

export function InboxPanel() {
  const [emails, setEmails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedThreadKey, setSelectedThreadKey] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [replyHtml, setReplyHtml] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const replyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchEmails();
  }, []);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/mail/inbox');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setEmails(data);
      } else {
         toast.error("Fehler beim Abrufen der E-Mails");
      }
    } catch (e) {
      console.error(e);
      toast.error("Netzwerkfehler");
    }
    setLoading(false);
  };

  // Gruppierung nach User+Subject oder Thread
  const threads = useMemo(() => {
    const grouped = new Map<string, any[]>();
    
    // Wir iterieren rückwärts, damit wir die ältesten zuerst in die Threads pushen können
    [...emails].reverse().forEach(e => {
        const participantEmail = e.isReply ? e.toEmail : e.fromEmail;
        
        // Entweder nach Ticket-ID greifen (falls in threadId gespeichert) oder Fallback auf User+Subject
        let threadKey = e.threadId;

        // Wenn kein threadId existiert (altes Format), baue einen Key aus Email + Subject
        if (!threadKey) {
            const normalizedSubject = (e.subject || '').replace(/^(Re|Fwd|AW|WG):\s*/i, '').trim() || 'Kein Betreff';
            threadKey = `${participantEmail}-${normalizedSubject}`.toLowerCase();
        }
        
        if (!grouped.has(threadKey)) {
            grouped.set(threadKey, []);
        }
        grouped.get(threadKey)!.push(e);
    });

    const threadsArray = Array.from(grouped.entries()).map(([key, msgs]) => {
        msgs.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        
        // Finde die erste Nachricht, um die Ticket-ID im Betreff zu prüfen
        const firstSubj = msgs[0].subject || '';
        const ticketMatch = firstSubj.match(/\[(DT-[A-Z0-9]{6})\]/i);
        const ticketId = ticketMatch ? ticketMatch[1].toUpperCase() : (key.startsWith('DT-') ? key : null);

        return {
            id: key,
            ticketId: ticketId,
            messages: msgs,
            latestMessage: msgs[msgs.length - 1],
            participantEmail: msgs[0].isReply ? msgs[0].toEmail : msgs[0].fromEmail,
            participantName: msgs.find(m => !m.isReply && m.fromName)?.fromName || null,
            subject: (msgs[0].subject || '').replace(/^(Re|Fwd|AW|WG):\s*/i, '').trim()
        };
    });

    // Neueste Konversationen zuerst anzeigen
    threadsArray.sort((a, b) => new Date(b.latestMessage.createdAt).getTime() - new Date(a.latestMessage.createdAt).getTime());
    
    return threadsArray;
  }, [emails]);

  const activeThread = threads.find(t => t.id === selectedThreadKey);

  useEffect(() => {
    if (activeThread && messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [activeThread?.messages?.length, selectedThreadKey]);

  const handleReply = async () => {
    if (!activeThread || !replyText.trim()) return;
    const lastMsg = activeThread.latestMessage;
    
    setSending(true);
    try {
      let subject = lastMsg.subject;
      // Ergänze Re: falls nötig
      if (!subject.startsWith('Re:')) {
        subject = `Re: ${subject}`;
      }
      // Achte darauf, dass die Ticket ID IMMER im Betreff bleibt
      if (activeThread.ticketId && !subject.includes(`[${activeThread.ticketId}]`)) {
        subject = `${subject} [${activeThread.ticketId}]`;
      }

      let extractedName = "Darts-Freund";
      if (activeThread.participantName) {
         extractedName = activeThread.participantName.trim().split(' ')[0] || "Darts-Freund";
      } else if (activeThread.participantEmail) {
         extractedName = activeThread.participantEmail.split('@')[0];
      }

      const processedText = replyText.replace(/\[name\]/gi, extractedName);
      let processedHtml = replyHtml;
      if (processedHtml) {
        processedHtml = processedHtml.replace(/\[name\]/gi, extractedName);
      }

      const payload: any = {
        to: activeThread.participantEmail,
        subject,
        text: processedText,
        inReplyTo: lastMsg.messageId,
        references: lastMsg.messageId,
        isSupportReply: true
      };
      if (processedHtml) payload.html = processedHtml;

      const res = await fetch('/api/mail/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        setReplyText('');
        setReplyHtml('');
        if (replyRef.current) replyRef.current.innerHTML = '';
        toast.success("Antwort erfolgreich gesendet");
        fetchEmails();
      } else {
        toast.error("Fehler beim Senden");
      }
    } catch (e) {
      console.error(e);
      toast.error("Netzwerkfehler");
    }
    setSending(false);
  };

  const handleDeleteThread = async (threadId: string | null) => {
    if (!threadId) return;
    if (!confirm('Gesamte Konversation wirklich löschen?')) return;
    
    try {
      const res = await fetch('/api/mail/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ threadId })
      });
      if (res.ok) {
        toast.success("Konversation gelöscht");
        setSelectedThreadKey(null);
        fetchEmails();
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch (e) {
      console.error(e);
      toast.error("Netzwerkfehler");
    }
  };

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Diese E-Mail wirklich aus dem Verlauf löschen?')) return;
    
    try {
      const res = await fetch('/api/mail/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: msgId })
      });
      if (res.ok) {
        toast.success("E-Mail gelöscht");
        fetchEmails();
      } else {
        toast.error("Fehler beim Löschen");
      }
    } catch (e) {
      console.error(e);
      toast.error("Netzwerkfehler");
    }
  };

  return (
    <Card className="h-[750px] flex flex-col">
      <CardHeader className="border-b">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2"><Inbox className="w-5 h-5"/> Posteingang Support</CardTitle>
            <CardDescription>Eingehende E-Mails an das System</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchEmails} disabled={loading} className="gap-2">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Aktualisieren
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-0 flex-1 flex overflow-hidden">
        {/* Sidebar Liste */}
        <div className="w-1/3 border-r overflow-y-auto bg-muted/10">
          {threads.length === 0 && !loading && (
            <div className="p-8 text-center text-muted-foreground text-sm">Keine Konversationen gefunden.</div>
          )}
          {threads.map((t) => (
            <div 
              key={t.id}
              onClick={() => setSelectedThreadKey(t.id)}
              className={`p-4 border-b cursor-pointer hover:bg-muted/30 transition-colors ${selectedThreadKey === t.id ? 'border-l-4 border-l-primary bg-muted/50' : 'border-l-4 border-l-transparent'}`}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-semibold text-sm truncate flex-1 flex items-center gap-1" title={t.participantName || t.participantEmail}>
                  {t.participantName || t.participantEmail}
                  <span className="text-xs font-normal text-muted-foreground bg-muted px-1.5 rounded-full">{t.messages.length}</span>
                </span>
                <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                  {new Date(t.latestMessage.createdAt).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              <div className="text-sm truncate text-foreground/80 font-medium">{t.subject}</div>
              <div className="text-xs truncate text-muted-foreground mt-1">
                {t.latestMessage.isReply ? 'Sie: ' : ''}{t.latestMessage.bodyText?.substring(0, 60) || ''}...
              </div>
            </div>
          ))}
        </div>

        {/* Detail Konversations- und Antwort Ansicht */}
        {activeThread ? (
          <div className="w-2/3 flex flex-col h-full bg-background">
            <div className="p-4 border-b shrink-0 bg-muted/5 flex gap-4">
              <div className="flex-1 overflow-hidden">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold break-words flex-1 truncate">{activeThread.subject}</h2>
                  {activeThread.ticketId && (
                    <span className="bg-primary/20 text-primary px-2 py-1 rounded text-xs font-mono whitespace-nowrap">
                      {activeThread.ticketId}
                    </span>
                  )}
                </div>
                <div className="text-sm text-muted-foreground mt-1">Konversation mit {activeThread.participantEmail}</div>
              </div>
              
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                   
                  className="shrink-0" 
                  title="DSGVO-Auszug per E-Mail senden"
                  disabled={sending}
                  onClick={async () => {
                    setSending(true);
                    try {
                      const res = await fetch('/api/mail/dsgvo', {
                        method: 'POST',
                        body: JSON.stringify({ 
                          email: activeThread.participantEmail,
                          threadId: activeThread.ticketId
                        }),
                        headers: { 'Content-Type': 'application/json' }
                      });
                      if (!res.ok) throw new Error("Fehler beim Senden");
                      toast.success('DSGVO-Auszug wurde per E-Mail gesendet!');
                    } catch (e) {
                      toast.error('Konnte DSGVO-Auszug nicht senden.');
                    } finally {
                      setSending(false);
                    }
                  }}
                >
                  <Send className="w-4 h-4 mr-2" />
                  DSGVO Senden
                </Button>
                
                <Button 
                  variant="outline" 
                  size="icon" 
                  className="text-destructive hover:bg-destructive/10 shrink-0" 
                  title="Ganze Konversation löschen"
                  onClick={() => handleDeleteThread(activeThread.ticketId || activeThread.id)}
                 >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto bg-muted/5 space-y-4">
              {activeThread.messages.map((msg, idx) => (
                <div key={msg.id || idx} className={`flex flex-col group ${msg.isReply ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[85%] rounded-lg p-4 shadow-sm border relative ${msg.isReply ? 'bg-primary/10 border-primary/20 text-foreground' : 'bg-background border-border text-foreground'}`}>
                    
                    {/* Delete single message overlay button */}
                    <button 
                      onClick={() => msg.id && handleDeleteMessage(msg.id)}
                      className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                      title="Diese E-Mail löschen"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>

                    <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground border-b border-border/50 pb-2 pr-6">
                       <User className="w-3 h-3" /> 
                       <span className="font-medium">{msg.isReply ? 'Support Team' : (msg.fromName || msg.fromEmail)}</span>
                       <span className="ml-auto">{new Date(msg.createdAt).toLocaleString('de-DE')}</span>
                    </div>
                    <div className="whitespace-pre-wrap font-sans text-sm break-words">
                      {msg.bodyText || 'Kein Textinhalt vorhanden.'}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            
            {/* Antwortbereich */}
            <div className="p-4 border-t bg-background shrink-0 space-y-3">
              <div className="flex items-center justify-between font-medium text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Reply className="w-4 h-4" /> Antworten an {activeThread.participantEmail}
                </div>
                <span className="text-xs text-muted-foreground font-normal">Tipp: Tippe <b>[name]</b>, um den Vornamen einzufügen!</span>
              </div>
              {/* rich text editor toolbar */}
              <div className="flex gap-2 pb-1">
                <button
                  type="button"
                  className="p-1 border rounded"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => document.execCommand('bold')}
                >B</button>
                <button
                  type="button"
                  className="p-1 border rounded"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => document.execCommand('italic')}
                >I</button>
                <button
                  type="button"
                  className="p-1 border rounded"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => document.execCommand('underline')}
                >U</button>
                <button
                  type="button"
                  className="p-1 border rounded"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    const url = prompt('Link-URL eingeben');
                    if (url) document.execCommand('createLink', false, url);
                  }}
                >Link</button>
              </div>

              <div
                ref={replyRef}
                contentEditable={!sending}
                suppressContentEditableWarning={true}
                className="min-h-[120px] resize-none focus-visible:ring-1 border p-2 overflow-auto" 
                data-placeholder="Hallo [name], vielen Dank für deine Nachricht..."
                onInput={() => {
                  const html = replyRef.current?.innerHTML || '';
                  const text = replyRef.current?.innerText || '';
                  setReplyHtml(html);
                  setReplyText(text);
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                    e.preventDefault();
                    handleReply();
                  }
                }}
              />
              <div className="flex justify-between items-center">
                 <span className="text-xs text-muted-foreground">Ctrl+Enter zum Senden</span>
                <Button onClick={handleReply} disabled={sending || !replyText.trim()}>
                  {sending ? 'Wird gesendet...' : 'Antwort senden'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="w-2/3 flex items-center justify-center text-muted-foreground text-sm flex-col gap-4 bg-muted/5">
            <Inbox className="w-12 h-12 opacity-20" />
            Wählen Sie eine Konversation aus der Liste aus
          </div>
        )}
      </CardContent>
    </Card>
  );
}
