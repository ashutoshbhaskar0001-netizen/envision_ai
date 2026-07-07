from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.models import Suppliers
from app.schemas import SupplierResponse, SupplierCreate
from app.agents.supplier_agent import SupplierAgent

router = APIRouter()
supplier_agent = SupplierAgent()

@router.get("", response_model=list[SupplierResponse])
def list_suppliers(db: Session = Depends(get_db)):
    return db.query(Suppliers).all()

@router.post("", response_model=SupplierResponse)
def create_supplier(supplier_data: SupplierCreate, db: Session = Depends(get_db)):
    supplier = Suppliers(**supplier_data.dict())
    db.add(supplier)
    db.commit()
    db.refresh(supplier)
    return supplier

@router.get("/compare")
def compare_suppliers(
    material: str = Query(..., description="Name of the material to find suppliers for"),
    quantity: int = Query(50, description="Quantity to purchase"),
    db: Session = Depends(get_db)
):
    recommendation = supplier_agent.recommend_supplier(db, material, quantity)
    if not recommendation:
        raise HTTPException(status_code=404, detail=f"No suppliers found for material '{material}'")
    return recommendation

@router.put("/{supplier_id}", response_model=SupplierResponse)
def update_supplier(supplier_id: int, supplier_data: SupplierCreate, db: Session = Depends(get_db)):
    supplier = db.query(Suppliers).filter(Suppliers.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
        
    for k, v in supplier_data.dict().items():
        setattr(supplier, k, v)
        
    db.commit()
    db.refresh(supplier)
    return supplier

@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db)):
    supplier = db.query(Suppliers).filter(Suppliers.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(supplier)
    db.commit()
    return {"status": "success", "message": f"Supplier {supplier_id} deleted successfully"}
