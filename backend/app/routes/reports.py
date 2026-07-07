import os
import tempfile
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from app.database import get_db
from app.agents.reporting_agent import ReportingAgent

router = APIRouter()
reporting_agent = ReportingAgent()

@router.get("/markdown")
def get_markdown_report(
    type: str = Query(..., description="Report type: budget, inventory, suppliers, weekly, monthly, executive"),
    db: Session = Depends(get_db)
):
    try:
        report_md = reporting_agent.generate_markdown_report(db, type)
        return {"report_type": type, "report_markdown": report_md}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {e}")

@router.get("/pdf")
def download_pdf_report(
    type: str = Query(..., description="Report type: budget, inventory, suppliers, weekly, monthly, executive"),
    db: Session = Depends(get_db)
):
    try:
        # Create a temp file path
        temp_dir = tempfile.gettempdir()
        file_name = f"ai_erp_report_{type}_{int(tempfile.time.time())}.pdf"
        output_path = os.path.join(temp_dir, file_name)
        
        # Generate the PDF file
        final_path = reporting_agent.generate_pdf_report(db, type, output_path)
        
        # Determine media type based on format (pdf vs fallback html)
        media_type = "application/pdf"
        if final_path.endswith(".html"):
            media_type = "text/html"
            
        return FileResponse(
            path=final_path,
            filename=os.path.basename(final_path),
            media_type=media_type
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download PDF: {e}")
