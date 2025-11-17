# Redis Implementation Summary

## Overview

This implementation adds Redis support to the Paint & Guess backend for horizontal scaling. Redis is **optional** - the server works perfectly fine without it in single-instance mode.

## What Was Implemented

### 1. Redis Client Module (`backend/src/redisClient.js`)
- Full Redis client configuration with ioredis
- Support for Redis URL or individual connection parameters
- Separate connections for client, subscriber, and publisher (required by Socket.io adapter)
- Graceful error handling and connection retry logic
- Automatic reconnection on failures

### 2. Socket.io Redis Adapter Integration
- Integrated `@socket.io/redis-adapter` for horizontal scaling
- Adapter is only enabled when Redis is configured
- Falls back to default in-memory adapter when Redis is disabled

### 3. Environment Variables
- `REDIS_ENABLED` - Enable Redis (set to "true")
- `REDIS_URL` - Full Redis connection URL (alternative to individual settings)
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)
- `REDIS_PASSWORD` - Redis password (optional)
- `REDIS_DB` - Redis database number (default: 0)

### 4. Health Check Enhancement
- `/api/health` endpoint now includes Redis status
- Shows whether Redis is enabled and adapter is active

### 5. Documentation
- Updated `backend/README.md` with:
  - Redis configuration options
  - Horizontal scaling setup guide
  - Docker Redis setup instructions
  - Load balancer configuration notes

## Dependencies Added

```json
{
  "@socket.io/redis-adapter": "^8.2.1",
  "ioredis": "^5.3.2"
}
```

## How It Works

### Single-Instance Mode (Default)
- Redis is disabled by default
- Socket.io uses in-memory adapter
- Works perfectly for single server deployments

### Horizontal Scaling Mode (Redis Enabled)
1. Multiple server instances connect to the same Redis server
2. Socket.io uses Redis adapter to broadcast events across instances
3. Players connected to different servers can communicate in the same rooms
4. All instances must also share the same database (PostgreSQL recommended)

## Usage Examples

### Enable Redis with URL
```bash
REDIS_URL="redis://localhost:6379" npm start
```

### Enable Redis with Individual Settings
```bash
REDIS_ENABLED="true"
REDIS_HOST="localhost"
REDIS_PORT="6379"
npm start
```

### Disable Redis (Default)
```bash
# Don't set any Redis variables, or explicitly:
REDIS_ENABLED="false" npm start
```

## Testing

1. **Test without Redis** (default):
   ```bash
   npm start
   # Should see: "⚪ Redis adapter: DISABLED (single-instance mode)"
   ```

2. **Test with Redis**:
   ```bash
   # Start Redis (Docker)
   docker run -d -p 6379:6379 redis:7-alpine
   
   # Start server with Redis
   REDIS_ENABLED="true" npm start
   # Should see: "🔴 Redis adapter: ENABLED (horizontal scaling active)"
   ```

3. **Test health endpoint**:
   ```bash
   curl http://localhost:3001/api/health
   # Should include redis.enabled and redis.adapter fields
   ```

## Architecture

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Server 1  │     │   Server 2  │     │   Server 3  │
│             │     │             │     │             │
│  Socket.io │     │  Socket.io │     │  Socket.io │
└──────┬──────┘     └──────┬──────┘     └──────┬──────┘
       │                  │                  │
       └──────────────────┼──────────────────┘
                          │
                    ┌─────▼─────┐
                    │   Redis   │
                    │  Adapter  │
                    └───────────┘
```

## Benefits

1. **Horizontal Scaling**: Run multiple server instances behind a load balancer
2. **High Availability**: If one server fails, others continue serving
3. **Load Distribution**: Distribute WebSocket connections across multiple servers
4. **Backward Compatible**: Works without Redis for single-instance deployments

## Next Steps (Optional Enhancements)

1. **Redis Session Store**: Cache player sessions in Redis for faster lookups
2. **Redis Pub/Sub for Room Events**: Use Redis pub/sub for room state synchronization
3. **Redis Rate Limiting**: Use Redis for rate limiting across instances
4. **Redis Metrics**: Track connection counts and room statistics in Redis

## Notes

- Redis is **completely optional** - the server works fine without it
- All server instances must connect to the same Redis server
- PostgreSQL is recommended for production (instead of SQLite) when using multiple instances
- The Redis adapter only handles Socket.io event broadcasting - room state is still managed in-memory and persisted to the database

