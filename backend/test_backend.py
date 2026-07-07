import json
import traceback
from fastapi.testclient import TestClient
from app.main import app

def run_tests():
    print("=========================================================")
    print("STARTING BACKEND SERVICE INTEGRATION TESTS")
    print("=========================================================")
    
    with TestClient(app) as client:
        # 1. API Health Check
        print("\n[Test 1] Querying Service Health...")
        try:
            response = client.get("/api/health")
            assert response.status_code == 200, "Health check failed"
            print(f"-> Success: {response.json()}")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 2. Dashboard Stats & Seeding Verification
        print("\n[Test 2] Querying Dashboard Stats & Database Seeds...")
        try:
            response = client.get("/api/dashboard/stats")
            assert response.status_code == 200, "Stats fetch failed"
            data = response.json()
            print(f"-> Success: Total Inventory Value: ${data['inventory_value']:,.2f}")
            print(f"-> Success: Low Stock Count: {data['low_stock_count']}")
            print(f"-> Success: Remaining Budget: ${data['budget_remaining']:,.2f}")
            print(f"-> Success: System Health: {data['system_health']}")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 3. Inventory Procurement Check
        print("\n[Test 3] Triggering Low Stock Auto-Procurement check...")
        try:
            response = client.post("/api/inventory/check")
            assert response.status_code == 200, "Procurement check failed"
            data = response.json()
            print(f"-> Success: {data['message']}")
            print(f"-> Success: Created {len(data['purchase_orders_created'])} purchase orders.")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 4. Purchase Simulation Verification
        print("\n[Test 4] Triggering Purchase Simulation Sandbox...")
        try:
            # Get suppliers
            supplier_compare = client.get("/api/suppliers")
            assert supplier_compare.status_code == 200, "Suppliers query failed"
            suppliers = supplier_compare.json()
            assert len(suppliers) > 0, "No suppliers seeded"
            
            target_supplier = suppliers[0]
            payload = {
                "material": target_supplier["material"],
                "quantity": 100,
                "supplier_id": target_supplier["id"],
                "price": target_supplier["price"]
            }
            
            response = client.post("/api/simulator/run", json=payload)
            assert response.status_code == 200, "Simulation failed"
            sim_data = response.json()
            print(f"-> Success: Simulation Result: {sim_data['decision']}")
            print(f"-> Success: savings: ${sim_data['savings_calculated']}")
            print(f"-> Success: Budget Impact: {sim_data['budget_impact']}")
            print(f"-> Success: Recommendation: {sim_data['recommendation']}")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 5. Self-Healing Intercept & Re-execute test
        print("\n[Test 5] Triggering Synthetic Zero-Division Exception (Self-Healing Agent)...")
        try:
            response = client.post("/api/self-healing/trigger-error")
            assert response.status_code == 200, "Self-healing trigger failed"
            data = response.json()
            print(f"-> Success: Status: {data['status']}")
            print(f"-> Success: Message: {data['message']}")
            if data['status'] == 'success':
                print(f"-> Success: Recovered Result: {data['execution_result']}")
            else:
                print(f"-> Success: Gracefully handled fallback state: {data['error_details']['resolution_details']}")
            print(f"-> Success: Error log details: {data['error_details']}")
        except Exception as e:
            print(f"-> Failed: {e}")
            traceback.print_exc()
            return False

    print("\n=========================================================")
    print("ALL TESTS PASSED SUCCESSFULLY!")
    print("=========================================================")
    return True

if __name__ == "__main__":
    run_tests()
