import os
from datetime import datetime
from sqlalchemy.orm import Session
from app.agents.base import BaseAgent
from app.models.models import Inventory, Suppliers, Budget, PurchaseOrders
from app.services.gemini_service import GeminiService

class ReportingAgent(BaseAgent):
    def __init__(self):
        super().__init__("Reporting Agent")
        self.gemini = GeminiService()

    def gather_erp_metrics(self, db: Session) -> dict:
        """Gathers all current business metrics from the database (all calculations are in Python)."""
        # 1. Inventory stats
        inventory_items = db.query(Inventory).all()
        total_items = len(inventory_items)
        total_value = sum(item.quantity * item.unit_price for item in inventory_items)
        low_stock_items = [i for i in inventory_items if i.quantity <= i.reorder_point]
        low_stock_count = len(low_stock_items)

        # 2. Supplier stats
        suppliers = db.query(Suppliers).all()
        total_suppliers = len(suppliers)

        # 3. Budget stats
        budget = db.query(Budget).first()
        budget_data = {}
        if budget:
            budget_data = {
                "monthly_budget": budget.monthly_budget,
                "salaries": budget.salaries,
                "rent": budget.rent,
                "utilities": budget.utilities,
                "operational_expenses": budget.operational_expenses,
                "remaining_budget": budget.remaining_budget,
                "used_budget": round(budget.monthly_budget - budget.remaining_budget, 2)
            }

        # 4. Purchase Order stats
        pos = db.query(PurchaseOrders).all()
        total_pos = len(pos)
        approved_pos = [p for p in pos if p.status == "Approved"]
        rejected_pos = [p for p in pos if p.status == "Rejected"]
        total_po_spend = sum(p.total_price for p in approved_pos)
        
        # Calculate savings (pre-calculated from PO logs or mock-derived if missing)
        total_savings = sum((db.query(Suppliers).filter(Suppliers.id == p.supplier_id).first().price * p.quantity - p.total_price) 
                            for p in approved_pos if db.query(Suppliers).filter(Suppliers.id == p.supplier_id).first())
        total_savings = round(max(0.0, total_savings), 2)

        return {
            "timestamp": datetime.utcnow().isoformat(),
            "inventory": {
                "total_items": total_items,
                "total_value": round(total_value, 2),
                "low_stock_count": low_stock_count,
                "items": [{"sku": i.sku, "name": i.name, "quantity": i.quantity, "unit_price": i.unit_price} for i in inventory_items]
            },
            "suppliers": {
                "total_suppliers": total_suppliers
            },
            "budget": budget_data,
            "purchase_orders": {
                "total_count": total_pos,
                "approved_count": len(approved_pos),
                "rejected_count": len(rejected_pos),
                "total_spend": round(total_po_spend, 2),
                "total_savings": total_savings
            }
        }

    def generate_markdown_report(self, db: Session, report_type: str) -> str:
        """Gathers data and generates report narrative using Gemini."""
        self.log_message(db, "INFO", f"Compiling data for {report_type} report...")
        data = self.gather_erp_metrics(db)
        
        self.log_message(db, "INFO", f"Sending pre-calculated metrics to Gemini for {report_type} narrative...")
        report_md = self.gemini.generate_report(report_type, data)
        
        self.log_decision(
            db,
            "Report Generated",
            {
                "report_type": report_type,
                "summary": f"Compiled report with total spend: ${data['purchase_orders']['total_spend']}"
            }
        )
        return report_md

    def generate_pdf_report(self, db: Session, report_type: str, output_path: str) -> str:
        """Generates a downloadable PDF report file on disk."""
        self.log_message(db, "INFO", f"Generating PDF report file at {output_path}...")
        report_md = self.generate_markdown_report(db, report_type)
        
        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        try:
            from reportlab.lib.pagesizes import letter
            from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
            from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
            from reportlab.lib import colors
            
            doc = SimpleDocTemplate(output_path, pagesize=letter)
            styles = getSampleStyleSheet()
            
            # Create custom stylesheet items
            title_style = ParagraphStyle(
                'ReportTitle',
                parent=styles['Heading1'],
                fontSize=24,
                leading=28,
                textColor=colors.HexColor("#1A365D"),
                spaceAfter=12
            )
            h2_style = ParagraphStyle(
                'ReportH2',
                parent=styles['Heading2'],
                fontSize=14,
                leading=18,
                textColor=colors.HexColor("#2B6CB0"),
                spaceBefore=10,
                spaceAfter=6
            )
            body_style = ParagraphStyle(
                'ReportBody',
                parent=styles['BodyText'],
                fontSize=10,
                leading=14,
                spaceAfter=6
            )
            
            story = []
            
            # Title
            story.append(Paragraph(f"AI ERP System - {report_type.replace('_', ' ').title()}", title_style))
            story.append(Paragraph(f"Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}", body_style))
            story.append(Spacer(1, 12))
            
            # Parse Markdown paragraphs roughly
            paragraphs = report_md.split("\n\n")
            for p in paragraphs:
                p = p.strip()
                if not p:
                    continue
                if p.startswith("# "):
                    story.append(Paragraph(p[2:], title_style))
                elif p.startswith("## "):
                    story.append(Paragraph(p[3:], h2_style))
                elif p.startswith("### "):
                    story.append(Paragraph(p[4:], h2_style))
                elif p.startswith("- ") or p.startswith("* "):
                    # Simple list rendering
                    items = p.split("\n")
                    for item in items:
                        item_text = item.strip().lstrip("- ").lstrip("* ")
                        story.append(Paragraph(f"&bull; {item_text}", body_style))
                else:
                    # Clean up bold syntax
                    cleaned = p.replace("**", "<b>").replace("__", "<b>").replace("</b><b>", "")
                    # Add simple bold tags conversion (need closed tags)
                    open_tags = cleaned.count("<b>")
                    if open_tags % 2 != 0:
                        cleaned += "</b>"
                    # Simple regex replace for matching pairs
                    # Let's do basic pair substitution:
                    parts = cleaned.split("<b>")
                    for idx in range(1, len(parts), 2):
                        parts[idx] = parts[idx] + "</b>"
                    cleaned = "".join(parts)
                    
                    story.append(Paragraph(cleaned, body_style))
                
            doc.build(story)
            self.log_message(db, "INFO", f"PDF report successfully created using ReportLab: {output_path}")
            
        except Exception as e:
            self.log_message(db, "WARNING", f"ReportLab PDF generation failed: {e}. Falling back to HTML/Text report file.")
            # Fallback to saving as markdown/txt format
            text_path = output_path.replace(".pdf", ".html")
            with open(text_path, "w", encoding="utf-8") as f:
                f.write(f"<html><head><style>body{{font-family:sans-serif;padding:40px;line-height:1.6;color:#333;}}h1{{color:#1A365D;}}h2{{color:#2B6CB0;}}</style></head><body>")
                f.write(f"<h1>AI ERP System - {report_type.replace('_', ' ').title()}</h1>")
                f.write(f"<p>Generated on: {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}</p>")
                # convert md to basic html
                html_body = report_md.replace("\n\n", "<p>").replace("\n- ", "<br>&bull; ").replace("**", "<b>")
                f.write(html_body)
                f.write("</body></html>")
            self.log_message(db, "INFO", f"Fallback HTML report saved at {text_path}")
            output_path = text_path

        return output_path
