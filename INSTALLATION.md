# Installation Guide

This guide covers how to install and run the NetFlow CRM application using different methods.

---

## Prerequisites

- **Node.js** v18+ and **npm/pnpm**
- **Git** (for cloning the repository)
- **Docker & Docker Compose** (only if using Docker deployment)

---

## Method 1: Local Development (Recommended for Development)

### Step 1: Download Project Files

**Option A: Using Builder.io UI**
1. Click the **"Download Project"** button in the top-right menu
2. Extract the ZIP file to your desired location

**Option B: Using Git Clone**
```bash
git clone <your-repository-url>
cd <project-folder>
```

**Option C: Using GitHub Download**
1. Go to your GitHub repository
2. Click **Code** → **Download ZIP**
3. Extract the folder locally

### Step 2: Install Dependencies

The project uses **pnpm** as the package manager (v10.14.0+):

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### Step 3: Configure Environment Variables (Optional)

Create a `.env.local` file in the project root for local development settings:

```bash
# .env.local
NODE_ENV=development
PORT=5173

# Optional: API endpoints
# VITE_API_URL=http://localhost:3000
```

### Step 4: Start Development Server

```bash
pnpm run dev
```

The app will be available at: **http://localhost:5173** (or the port shown in terminal)

### Step 5: Build for Production (Optional)

```bash
pnpm run build
```

This creates optimized production files in the `dist/` folder.

---

## Method 2: Docker Deployment (Recommended for Production)

### Prerequisites
- Docker v20.10+
- Docker Compose v2.0+
- Linux server (Ubuntu, Debian, CentOS, etc.) or Docker Desktop on Windows/Mac

### Step 1: Install Docker

**On Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo usermod -aG docker $USER
newgrp docker
```

**On CentOS/RHEL:**
```bash
sudo yum install -y docker docker-compose
sudo systemctl start docker
sudo systemctl enable docker
```

**On macOS/Windows:**
Download [Docker Desktop](https://www.docker.com/products/docker-desktop)

### Step 2: Download Project Files

```bash
git clone <your-repository-url> /opt/netflow-crm
cd /opt/netflow-crm
```

Or upload files via SCP/SFTP.

### Step 3: Configure Environment Variables

Create a `.env` file in the project root:

```bash
# .env
NODE_ENV=production
PORT=3000

# Optional: Database
# DATABASE_URL=postgresql://user:password@localhost/netflow

# Optional: Mikrotik API
# MIKROTIK_API_URL=https://your-router-ip:8728
# MIKROTIK_USERNAME=admin
# MIKROTIK_PASSWORD=your_password

# Optional: RADIUS
# RADIUS_HOST=your-radius-server
# RADIUS_PORT=1812
# RADIUS_SECRET=your_shared_secret

# Optional: M-Pesa
# MPESA_CONSUMER_KEY=your_key
# MPESA_CONSUMER_SECRET=your_secret
# MPESA_BUSINESS_SHORT_CODE=your_code
# MPESA_PASSKEY=your_passkey
```

**⚠️ Security Note:** Never commit `.env` files to version control. Add `.env` to `.gitignore`.

### Step 4: Build and Deploy

**Using Docker Compose (Recommended):**

```bash
# Start the application
docker-compose up -d

# View logs
docker-compose logs -f app

# Stop the application
docker-compose down
```

Access the app at: **http://your-server-ip** (or port 3000 directly)

**Using Docker directly:**

```bash
# Build the image
docker build -t netflow-crm:latest .

# Run the container
docker run -d \
  --name netflow-crm \
  -p 3000:3000 \
  -e NODE_ENV=production \
  --restart unless-stopped \
  netflow-crm:latest

# Check status
docker logs netflow-crm
```

### Step 5: Enable HTTPS/SSL (Optional but Recommended)

1. Obtain SSL certificates using Let's Encrypt:

```bash
sudo apt-get install certbot
sudo certbot certonly --standalone -d your-domain.com
```

2. Copy certificates to project:

```bash
mkdir -p certs
sudo cp /etc/letsencrypt/live/your-domain.com/fullchain.pem certs/cert.pem
sudo cp /etc/letsencrypt/live/your-domain.com/privkey.pem certs/key.pem
sudo chown $USER:$USER certs/
```

3. Uncomment HTTPS sections in `nginx.conf` and restart containers

---

## Verify Installation

### Local Development
```bash
# Terminal should show:
# VITE v7.1.2 ready in 245 ms
# ➜  Local:   http://localhost:5173/
```

### Docker Deployment
```bash
# Check running containers
docker-compose ps

# Should show "app" service with status "Up"

# Test the app
curl http://your-server-ip:3000
```

---

## Common Commands

### Development
```bash
pnpm run dev              # Start dev server
pnpm run build            # Build for production
pnpm run start            # Run production build
pnpm run test             # Run tests
pnpm run typecheck        # Check TypeScript
pnpm run format.fix       # Format code with Prettier
```

### Docker
```bash
docker-compose up -d      # Start containers (background)
docker-compose logs -f    # View logs in real-time
docker-compose ps         # List running containers
docker-compose restart    # Restart containers
docker-compose down       # Stop containers
docker-compose down -v    # Stop and remove volumes
```

---

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000

# Or change port in docker-compose.yml
```

### Dependencies Won't Install
```bash
# Clear pnpm cache
pnpm store prune

# Reinstall dependencies
pnpm install
```

### Docker Container Won't Start
```bash
# Check logs for errors
docker-compose logs app

# Rebuild without cache
docker-compose build --no-cache
docker-compose up -d
```

### Out of Memory
```bash
# Limit Docker memory in docker-compose.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
```

---

## Next Steps

1. ✅ Install and run the application
2. 📝 Configure environment variables for your services
3. 🔐 Set up authentication and API credentials
4. 🚀 Deploy to your server using Docker
5. 📊 Monitor logs and performance

For detailed Docker deployment configuration, see [DOCKER_DEPLOYMENT.md](./DOCKER_DEPLOYMENT.md)

---

**Questions or Issues?** Refer to the Docker or Vite documentation:
- [Docker Docs](https://docs.docker.com)
- [Vite Docs](https://vitejs.dev)
- [Express.js Docs](https://expressjs.com)
