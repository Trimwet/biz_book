# Quick Reference Commands

## Verify Migration Success

### Check Database Connection
```powershell
node backend/verify-connection.js
```

### View Database Structure
```powershell
node backend/check-price-tracker.js
```

---

## Start Backend Server

```powershell
# From project root
cd "C:\Users\MAFUYAI\Documents\PROJECT BUSINESS\biz book\backend"
npm start
```

Or:
```powershell
node index.js
```

---

## Test Server Health

### Option 1: Using browser
Open: http://localhost:3001/health

### Option 2: Using PowerShell
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### Option 3: Using test script
```powershell
# Start server first, then in another terminal:
node backend/test-health.js
```

---

## Test API Endpoints

### Health Check
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET
```

### Get All Products
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/products" -Method GET
```

### Get All Vendors
```powershell
Invoke-RestMethod -Uri "http://localhost:3001/api/vendors" -Method GET
```

---

## Switch Database (If Needed)

### Switch to price_tracker
Edit `backend/.env`:
```
DB_NAME=price_tracker
```

### Switch back to biz_book
Edit `backend/.env`:
```
DB_NAME=biz_book
```

Then restart the server.

---

## Database Management

### Connect to PostgreSQL (if psql is available)
```powershell
psql -U postgres -d price_tracker
```

### Common SQL Commands (once connected)
```sql
-- List all tables
\dt

-- Describe a table
\d products

-- Count records
SELECT COUNT(*) FROM products;

-- View all users
SELECT id, email, user_type FROM users;

-- View all vendors
SELECT id, business_name, category FROM vendors;

-- Exit
\q
```

---

## Troubleshooting

### Server won't start
1. Check PostgreSQL is running
2. Verify `.env` file settings
3. Check port 3001 is not in use:
   ```powershell
   netstat -ano | findstr :3001
   ```

### Database connection issues
```powershell
node backend/verify-connection.js
```

### Reset to original biz_book database
1. Edit `backend/.env`: Change `DB_NAME=price_tracker` to `DB_NAME=biz_book`
2. Restart server

---

## Cleanup (Optional)

### Remove migration scripts
```powershell
Remove-Item "backend/check-price-tracker.js"
Remove-Item "backend/migrate-to-price-tracker.js"
Remove-Item "backend/fix-products-specifications.js"
Remove-Item "backend/cleanup-products-columns.js"
Remove-Item "backend/verify-connection.js"
Remove-Item "backend/test-health.js"
```

### Remove old wishlist backup (after verifying everything works)
Connect to database and run:
```sql
DROP TABLE IF EXISTS wishlist_old;
```

---

## Project Structure

```
biz book/
├── backend/
│   ├── .env                    ← Database config (UPDATED)
│   ├── index.js                ← Main server file
│   ├── utils.js                ← Database pool & auth
│   ├── routes/                 ← API routes
│   ├── middleware/             ← Middleware functions
│   └── uploads/                ← Uploaded images
├── frontend/                   ← React frontend
└── MIGRATION_TO_PRICE_TRACKER.md ← Full migration docs
```

---

**Current Database:** `price_tracker`  
**Server Port:** `3001`  
**Environment:** `development`
