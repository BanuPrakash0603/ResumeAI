# ResumeAI v2 — AWS Deployment Guide
## Browser-Only (EC2 Instance Connect) — No Local Terminal

> All commands run inside **AWS EC2 Instance Connect** in your browser.
> Never needed: local terminal, PowerShell, or SSH client.

---

## Architecture

```
Internet → EC2 (Ubuntu 24, t3.small)
              ├── Nginx :80/:443 (reverse proxy)
              ├── React build (served by Nginx)
              ├── Flask API (Gunicorn :5000)
              └── SQLite DB (file on disk, survives reboots)
```

**Cost**: t3.small ~$15/month or t2.micro (free tier eligible, slower).

---

## Step 1 — Launch EC2

1. AWS Console → EC2 → **Launch Instance**
2. **Name**: `resumeai-server`
3. **AMI**: Ubuntu Server 24.04 LTS (x86_64)
4. **Instance type**: `t3.small` (2 vCPU, 2GB RAM)
5. **Key pair**: Create new → `resumeai-key` (download .pem, keep safe)
6. **Security Group** — Add these inbound rules:
   - SSH (22) — from Anywhere
   - HTTP (80) — from Anywhere
   - HTTPS (443) — from Anywhere
7. **Storage**: 20 GB
8. **Launch Instance**

---

## Step 2 — Connect via Browser

1. EC2 → Instances → select your instance
2. Wait for **2/2 checks passed**
3. Click **Connect** → **EC2 Instance Connect** tab → **Connect**

> A browser terminal opens. All following commands go here.

---

## Step 3 — Install System Packages

```bash
sudo apt-get update -y && sudo apt-get upgrade -y

# Python, Node, Nginx, Git
sudo apt-get install -y python3-pip python3-venv nodejs npm nginx git curl unzip

# Verify
python3 --version   # should be 3.11+
node --version      # should be 20+
nginx -v
```

---

## Step 4 — Upload Your Project

### Option A: GitHub (recommended)
```bash
git clone https://github.com/YOUR_USERNAME/ResumeAI-v2.git
cd ResumeAI-v2
```

### Option B: Upload ZIP via EC2 Instance Connect
- Click the **Upload file** button in the browser terminal
- Upload `ResumeAI-v2.zip`

```bash
unzip ResumeAI-v2.zip
cd ResumeAI-v2
```

---

## Step 5 — Backend Setup

```bash
cd backend

# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Get your server's public IP
curl -s http://checkip.amazonaws.com
# Note it: e.g. 54.123.45.67
```

Create the .env file:
```bash
nano .env
```

Paste this (replace values):
```
FLASK_ENV=production
SECRET_KEY=paste-a-long-random-string-here-min-32-chars
FRONTEND_URL=http://54.123.45.67
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
OPENAI_API_KEY=sk-...
PORT=5000
```

Save: `Ctrl+O` → `Enter` → `Ctrl+X`

Test it starts:
```bash
source venv/bin/activate
python app.py
# Should print: Running on http://0.0.0.0:5000
# Press Ctrl+C to stop
```

---

## Step 6 — Frontend Build

```bash
cd ~/ResumeAI-v2/frontend

# Install dependencies
npm install

# Set API URL to your EC2 IP
echo "VITE_API_URL=http://54.123.45.67" > .env
# If using a domain: echo "VITE_API_URL=https://yourdomain.com/api" > .env

# Build production bundle
npm run build
# Creates frontend/dist/ directory
```

---

## Step 7 — Nginx Config

```bash
sudo nano /etc/nginx/sites-available/resumeai
```

Paste:
```nginx
server {
    listen 80;
    server_name _;

    # Serve React frontend
    root /home/ubuntu/ResumeAI-v2/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Proxy Flask API
    location /api/ {
        proxy_pass http://127.0.0.1:5000/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 60s;
        client_max_body_size 10M;
    }

    gzip on;
    gzip_types text/plain text/css application/json application/javascript;
}
```

Save → `Ctrl+O`, `Enter`, `Ctrl+X`

```bash
# Enable config
sudo ln -sf /etc/nginx/sites-available/resumeai /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx
```

**Important**: Update frontend .env to use `/api` prefix if using Nginx proxy path:
```bash
cd ~/ResumeAI-v2/frontend
echo "VITE_API_URL=http://54.123.45.67/api" > .env
# For domain: echo "VITE_API_URL=https://yourdomain.com/api" > .env
npm run build
```

---

## Step 8 — Run Backend with Gunicorn (Systemd Service)

```bash
sudo nano /etc/systemd/system/resumeai.service
```

Paste:
```ini
[Unit]
Description=ResumeAI Flask API
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/ResumeAI-v2/backend
Environment="PATH=/home/ubuntu/ResumeAI-v2/backend/venv/bin"
EnvironmentFile=/home/ubuntu/ResumeAI-v2/backend/.env
ExecStart=/home/ubuntu/ResumeAI-v2/backend/venv/bin/gunicorn \
    --workers 2 \
    --bind 127.0.0.1:5000 \
    --timeout 120 \
    app:app
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable resumeai
sudo systemctl start resumeai

# Verify it's running
sudo systemctl status resumeai

# Check logs
sudo journalctl -u resumeai -n 50
```

---

## Step 9 — Test

```bash
# API health
curl http://localhost:5000/health

# Frontend
curl -I http://localhost
```

Open in browser: `http://YOUR_EC2_IP`

---

## Step 10 — Custom Domain (Optional)

If you have a domain (e.g., from Namecheap or GoDaddy):

1. Add an **A record** pointing to your EC2 IP in your domain's DNS settings
2. Wait 5–30 min for DNS propagation
3. Install HTTPS (free SSL via Let's Encrypt):

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
# Follow prompts: enter email, agree to terms, choose redirect HTTP→HTTPS
```

4. Update `.env` and rebuild frontend:
```bash
cd ~/ResumeAI-v2/backend
nano .env
# Change FRONTEND_URL=https://yourdomain.com

cd ~/ResumeAI-v2/frontend
echo "VITE_API_URL=https://yourdomain.com/api" > .env
npm run build

sudo systemctl restart resumeai
```

---

## Useful Commands (After Deployment)

```bash
# View API logs live
sudo journalctl -u resumeai -f

# Restart API after code changes
sudo systemctl restart resumeai

# Redeploy frontend after code changes
cd ~/ResumeAI-v2/frontend && npm run build

# Pull latest code from GitHub
cd ~/ResumeAI-v2 && git pull
cd frontend && npm run build
cd ../backend && sudo systemctl restart resumeai

# Check disk usage
df -h

# Check memory
free -h

# Check nginx logs
sudo tail -f /var/log/nginx/error.log
```

---

## Checkpoint — Resume After Session Limit

If you hit your message limit, all server processes keep running.
When you reconnect via EC2 Instance Connect:

```bash
# Check status
sudo systemctl status resumeai
sudo systemctl status nginx

# If stopped, restart
sudo systemctl start resumeai
sudo systemctl start nginx

# DB is safe — SQLite file persists on disk
ls -lh ~/ResumeAI-v2/backend/resumeai.db
```

---

## Cost Summary

| Resource | Cost |
|----------|------|
| t2.micro (free tier 12 months) | $0 |
| t3.small | ~$15/month |
| 20GB EBS | ~$2/month |
| Data transfer < 1GB | Free |

**Tip**: Stop the instance when not demoing to save money. Data persists on EBS.
