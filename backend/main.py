from fastapi import FastAPI, UploadFile, HTTPException, Response
from fastapi.responses import FileResponse
from fastapi.middleware.cors import CORSMiddleware
import os

origins = [
    "http://localhost",
    "http://localhost:8100",
    "http://localhost:8080",
]
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],  # Allow all methods (GET, POST, PUT, DELETE, etc.)
    allow_headers=["*"],   # Allow all headers
)

UPLOAD_DIR = "uploads"
if not os.path.exists(UPLOAD_DIR):
    os.makedirs(UPLOAD_DIR)
    
@app.options("/upload/{filename}")
async def options_handler(path: str, response: Response):
    print("OPTIONS", path)
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "OPTIONS, GET, POST, PUT"
    response.headers["Access-Control-Allow-Headers"] = "Authorization, Content-Type"
    return response

@app.put("/upload/{filename}")
async def upload_file(filename: str, file: UploadFile):
    print("Request received")
    file_path = os.path.join(UPLOAD_DIR, filename)
    
    try:
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    return {"message": f"File '{filename}' uploaded successfully."}

@app.get("/download/{filename}")
def download_file(filename: str):
    file_path = os.path.join(UPLOAD_DIR, filename)
    if os.path.exists(file_path):
        return FileResponse(file_path, filename=filename)
    raise HTTPException(status_code=404, detail="File not found")