# Nginx Configuration for Server-Sent Events (SSE)

If you are running the application behind Nginx in production, you MUST disable buffering for the SSE endpoint. Otherwise, the "Connected" status will flicker or stay disconnected because Nginx holds back the data.

Add this location block to your Nginx configuration (inside the `server` block, before the general `location /` block):

```nginx
    # SSE (Server-Sent Events) specific configuration
    # This is CRITICAL for the "Connected" status to work
    location /api/dashboard/tournament/events {
        proxy_pass http://localhost:3000;
        
        # Disable buffering
        proxy_buffering off;
        proxy_cache off;
        
        # Connection headers
        proxy_set_header Connection '';
        proxy_http_version 1.1;
        chunked_transfer_encoding off;
        
        # Timeouts (keep connection open longer)
        proxy_read_timeout 24h;
        
        # Standard headers
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
```

## Why is this needed?
By default, Nginx waits until it has collected a certain amount of data (buffering) before sending it to the browser. Since SSE sends small updates sporadically, Nginx holds them back, causing the browser to think the connection is dead or silent. `proxy_buffering off` forces Nginx to forward every byte immediately.
