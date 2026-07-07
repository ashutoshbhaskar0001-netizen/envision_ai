from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Inventory Schemas
class InventoryBase(BaseModel):
    sku: str
    name: str
    category: str
    quantity: int
    reorder_point: int
    reorder_quantity: int
    overstock_threshold: int
    unit_price: float

class InventoryCreate(InventoryBase):
    pass

class InventoryResponse(InventoryBase):
    id: int
    last_checked: datetime

    class Config:
        from_attributes = True

# Supplier Schemas
class SupplierBase(BaseModel):
    name: str
    material: str
    price: float
    delivery_days: int
    rating: float
    is_preferred: bool = False
    phone: Optional[str] = None
    email: Optional[str] = None

class SupplierCreate(SupplierBase):
    pass

class SupplierResponse(SupplierBase):
    id: int

    class Config:
        from_attributes = True

# Budget Schemas
class BudgetBase(BaseModel):
    monthly_budget: float
    salaries: float
    rent: float
    utilities: float
    operational_expenses: float
    remaining_budget: float

class BudgetResponse(BudgetBase):
    id: int

    class Config:
        from_attributes = True

# Purchase Order Schemas
class PurchaseOrderCreate(BaseModel):
    sku: str
    quantity: int
    supplier_id: int
    total_price: float
    notes: Optional[str] = None

class PurchaseOrderResponse(BaseModel):
    id: int
    sku: str
    quantity: int
    supplier_id: int
    total_price: float
    status: str
    created_at: datetime
    approved_at: Optional[datetime] = None
    notes: Optional[str] = None
    supplier: Optional[SupplierResponse] = None

    class Config:
        from_attributes = True

# Employee Schemas
class EmployeeBase(BaseModel):
    name: str
    role: str
    salary: float

class EmployeeResponse(EmployeeBase):
    id: int

    class Config:
        from_attributes = True

# AI History Schemas
class AIHistoryResponse(BaseModel):
    id: int
    timestamp: datetime
    agent_name: str
    action_type: str
    decision_details: Dict[str, Any]

    class Config:
        from_attributes = True

# Error Logs Schemas
class ErrorLogResponse(BaseModel):
    id: int
    timestamp: datetime
    error_message: str
    stack_trace: str
    code_context: Optional[str] = None
    resolved: bool
    resolution_details: Optional[str] = None

    class Config:
        from_attributes = True

# Agent Logs Schemas
class AgentLogResponse(BaseModel):
    id: int
    timestamp: datetime
    agent_name: str
    log_level: str
    message: str

    class Config:
        from_attributes = True

# System Health Schemas
class SystemHealthResponse(BaseModel):
    id: int
    timestamp: datetime
    cpu_usage: float
    memory_usage: float
    db_status: str
    api_status: str
    response_time_ms: float

    class Config:
        from_attributes = True

# Simulator Schemas
class SimulatorRequest(BaseModel):
    material: str
    quantity: int
    supplier_id: int
    price: float

class SimulatorStep(BaseModel):
    agent_name: str
    action: str
    details: str
    timestamp: str

class SimulatorResponse(BaseModel):
    success: bool
    decision: str
    steps: List[SimulatorStep]
    savings_calculated: float
    budget_impact: Dict[str, Any]
    recommendation: str
