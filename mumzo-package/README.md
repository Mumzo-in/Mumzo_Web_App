# Mumzo — Full Project

Waitlist landing site for **Mumzo**, a quick-commerce store for moms & babies launching in Hyderabad.
Stack: **React (CRA + Craco)** frontend, **FastAPI** backend, **MongoDB** storage, optional **Google Sheets** sync.

## Structure
```
mumzo/
├── backend/          # FastAPI app
│   ├── server.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/         # React app
    ├── package.json
    ├── craco.config.js
    ├── tailwind.config.js
    ├── public/
    └── src/
```

## Local run
```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env    # then edit values
uvicorn server:app --reload --port 8001

# Frontend (in another terminal)
cd frontend
cp .env.example .env    # set REACT_APP_BACKEND_URL=http://localhost:8001
yarn install
yarn start
```

## Production deploy (Hostinger VPS)
See the deploy notes we discussed in chat. Short version:
1. Point domain DNS at your VPS IP.
2. Install: `python3 python3-venv nodejs npm nginx certbot python3-certbot-nginx` and `npm i -g yarn pm2`.
3. Backend: `pm2 start "venv/bin/gunicorn -w 2 -k uvicorn.workers.UvicornWorker server:app --bind 127.0.0.1:8001" --name mumzo-api`
4. Frontend: `yarn build`, serve `frontend/build/` via Nginx.
5. Nginx: proxy `/api/` → `127.0.0.1:8001`, static → `frontend/build`.
6. HTTPS: `certbot --nginx -d mumzo.in -d www.mumzo.in`.

## Environment variables
### backend/.env
```
MONGO_URL="mongodb+srv://..."       # MongoDB Atlas connection string
DB_NAME="mumzo"
CORS_ORIGINS="https://mumzo.in,https://www.mumzo.in"
GOOGLE_SHEETS_WEBHOOK_URL="https://script.google.com/macros/s/..../exec"
```

### frontend/.env
```
REACT_APP_BACKEND_URL="https://mumzo.in"
```
(For local dev, use `http://localhost:8001`.)

## Google Sheets sync
Backend fires a fire-and-forget `POST` to `GOOGLE_SHEETS_WEBHOOK_URL` on every signup.
Deploy an Apps Script Web App on your Sheet with this `doPost`:

```javascript
function doPost(e) {
  const sheet = SpreadsheetApp.getActive().getSheetByName('Sheet1');
  const d = JSON.parse(e.postData.contents);
  sheet.appendRow([d.id, d.name, d.phone, d.address, d.pincode,
                   d.baby_name, d.baby_age, d.is_hyderabad, d.position, d.created_at]);
  return ContentService.createTextOutput(JSON.stringify({ok:true}))
    .setMimeType(ContentService.MimeType.JSON);
}
```
Sheet header row: `id | name | phone | address | pincode | baby_name | baby_age | is_hyderabad | position | created_at`

## API
- `GET /api/` — health check
- `POST /api/waitlist` — join (body: name, phone, address, pincode, baby_name, baby_age)
- `GET /api/waitlist/count`
- `GET /api/waitlist` — list all entries
- `GET /api/waitlist/pincode-check?pincode=500001`

Hyderabad pincodes = `500xxx` or `501xxx`. Non-Hyderabad signups are stored with `is_hyderabad=false` (future-cities list).
