from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text, ForeignKey, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.database import Base

class Inventory(Base):
    __tablename__ = "inventory"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    category = Column(String, nullable=False)
    quantity = Column(Integer, default=0)
    reorder_point = Column(Integer, default=10)
    reorder_quantity = Column(Integer, default=50)
    overstock_threshold = Column(Integer, default=500)
    unit_price = Column(Float, default=0.0)
    last_checked = Column(DateTime, default=func.now(), onupdate=func.now())

class Suppliers(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    material = Column(String, index=True, nullable=False)
    price = Column(Float, nullable=False)
    delivery_days = Column(Integer, nullable=False)
    rating = Column(Float, default=5.0)  # Rating from 1.0 to 5.0
    is_preferred = Column(Boolean, default=False)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)

    purchase_orders = relationship("PurchaseOrders", back_populates="supplier")

class Budget(Base):
    __tablename__ = "budget"

    id = Column(Integer, primary_key=True, index=True)
    monthly_budget = Column(Float, default=100000.0)
    salaries = Column(Float, default=20000.0)
    rent = Column(Float, default=5000.0)
    utilities = Column(Float, default=2000.0)
    operational_expenses = Column(Float, default=10000.0)
    remaining_budget = Column(Float, default=63000.0)

class PurchaseOrders(Base):
    __tablename__ = "purchase_orders"

    id = Column(Integer, primary_key=True, index=True)
    sku = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    total_price = Column(Float, nullable=False)
    status = Column(String, default="Pending")  # Pending, Approved, Rejected, Completed
    created_at = Column(DateTime, default=func.now())
    approved_at = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)

    supplier = relationship("Suppliers", back_populates="purchase_orders")

class Employees(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    role = Column(String, nullable=False)
    salary = Column(Float, nullable=False)

class AIHistory(Base):
    __tablename__ = "ai_history"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    agent_name = Column(String, nullable=False)
    action_type = Column(String, nullable=False)  # Decision, Recommendation, Analysis
    decision_details = Column(JSON, nullable=False)  # Detail payload

class ErrorLogs(Base):
    __tablename__ = "error_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    error_message = Column(Text, nullable=False)
    stack_trace = Column(Text, nullable=False)
    code_context = Column(Text, nullable=True)
    resolved = Column(Boolean, default=False)
    resolution_details = Column(Text, nullable=True)

class AgentLogs(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    agent_name = Column(String, nullable=False)
    log_level = Column(String, nullable=False)  # INFO, WARNING, ERROR, DEBUG
    message = Column(Text, nullable=False)

class SystemHealth(Base):
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    timestamp = Column(DateTime, default=func.now())
    cpu_usage = Column(Float, nullable=False)
    memory_usage = Column(Float, nullable=False)
    db_status = Column(String, nullable=False)  # Healthy, Fallback, Degraded
    api_status = Column(String, nullable=False)  # Healthy, API Key Missing, Failed
    response_time_ms = Column(Float, nullable=False)
