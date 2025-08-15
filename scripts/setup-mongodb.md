# MongoDB Setup Guide

## Quick Setup Options

### Option 1: Docker (Recommended for Development)
```bash
# Start MongoDB with Docker
docker run -d \
  --name agora-mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_DATABASE=agora-backend \
  mongo:latest

# Check if it's running
docker ps

# Stop MongoDB
docker stop agora-mongodb

# Start MongoDB again
docker start agora-mongodb
```

### Option 2: MongoDB Atlas (Cloud)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free account
3. Create a new cluster
4. Get your connection string
5. Update your `.env` file:
   ```
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/agora-backend
   ```

### Option 3: Local Installation

#### Windows
1. Download MongoDB from [MongoDB Download Center](https://www.mongodb.com/try/download/community)
2. Install MongoDB
3. Start MongoDB service:
   ```cmd
   net start MongoDB
   ```

#### macOS
```bash
# Install with Homebrew
brew tap mongodb/brew
brew install mongodb-community

# Start MongoDB
brew services start mongodb/brew/mongodb-community
```

#### Linux (Ubuntu/Debian)
```bash
# Import MongoDB public GPG key
wget -qO - https://www.mongodb.org/static/pgp/server-6.0.asc | sudo apt-key add -

# Add MongoDB repository
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu focal/mongodb-org/6.0 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-6.0.list

# Update package list and install
sudo apt-get update
sudo apt-get install -y mongodb-org

# Start MongoDB
sudo systemctl start mongod
sudo systemctl enable mongod
```

## Verify Connection

After setting up MongoDB, test the connection:

```bash
# Run the development server
npm run dev

# Check health endpoint
curl http://localhost:3000/api/health
```

The health endpoint should show database status as "Connected".

## Troubleshooting

### Connection Refused Error
- Make sure MongoDB is running
- Check if port 27017 is available
- Verify your MongoDB URI in `.env` file

### Permission Issues
- On Linux/macOS, you might need to create data directory:
  ```bash
  sudo mkdir -p /data/db
  sudo chown -R $USER /data/db
  ```

### Docker Issues
- Make sure Docker is running
- Check if port 27017 is already in use:
  ```bash
  netstat -an | grep 27017
  ```