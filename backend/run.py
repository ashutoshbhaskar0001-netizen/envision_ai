import uvicorn
from app.config import PORT, HOST

if __name__ == "__main__":
    print(f"Starting Multi-Agent ERP Backend on http://{HOST}:{PORT}")
    uvicorn.run("app.main:app", host=HOST, port=PORT, reload=True)
