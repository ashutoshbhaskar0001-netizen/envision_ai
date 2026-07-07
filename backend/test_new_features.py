import sys
from fastapi.testclient import TestClient
from app.main import app

def run_new_tests():
    print("=========================================================")
    print("STARTING TEST SUITE FOR NEW ERP FEATURES")
    print("=========================================================")
    
    with TestClient(app) as client:
        # 1. Test GET /api/ai/analyze
        print("\n[Test 1] Querying AI Analysis Endpoint (/api/ai/analyze)...")
        try:
            response = client.get("/api/ai/analyze")
            assert response.status_code == 200, f"AI Analysis failed with status {response.status_code}"
            data = response.json()
            print(f"-> Success: Confidence: {data['confidence']}%")
            print(f"-> Success: Execution Time: {data['execution_time_ms']} ms")
            print(f"-> Success: Recommendations found: {len(data['supplier_recommendations'])}")
            print(f"-> Success: Budget Status: {data['budget_approval']['reason']}")
            assert "summary" in data, "Summary missing from AI response"
            print("-> Success: AI Summary generated.")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 2. Test PUT /api/suppliers/{supplier_id}
        print("\n[Test 2] Testing Supplier Edit (PUT)...")
        try:
            # Query suppliers first to get a valid ID
            suppliers_res = client.get("/api/suppliers")
            assert suppliers_res.status_code == 200
            suppliers_list = suppliers_res.json()
            assert len(suppliers_list) > 0, "No suppliers found in DB"
            
            target_supplier = suppliers_list[0]
            sup_id = target_supplier["id"]
            
            # Edit details
            payload = {
                "name": "Apex Metals Corp (Updated)",
                "material": target_supplier["material"],
                "price": target_supplier["price"] - 5.0, # offer discount
                "delivery_days": target_supplier["delivery_days"],
                "rating": 4.9,
                "is_preferred": True,
                "phone": "+1 555-0100",
                "email": "contact@apexmetals-updated.com"
            }
            
            put_res = client.put(f"/api/suppliers/{sup_id}", json=payload)
            assert put_res.status_code == 200, f"Supplier PUT failed: {put_res.text}"
            updated_supplier = put_res.json()
            assert updated_supplier["name"] == "Apex Metals Corp (Updated)"
            assert updated_supplier["price"] == target_supplier["price"] - 5.0
            assert updated_supplier["phone"] == "+1 555-0100"
            assert updated_supplier["email"] == "contact@apexmetals-updated.com"
            print(f"-> Success: Updated supplier {sup_id} to name: '{updated_supplier['name']}', email: '{updated_supplier['email']}'")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 3. Test DELETE /api/suppliers/{supplier_id}
        print("\n[Test 3] Testing Supplier Delete (DELETE)...")
        try:
            # Add a temporary supplier to delete
            temp_payload = {
                "name": "Temp Supplier to Delete",
                "material": "Gold Dust",
                "price": 1000.0,
                "delivery_days": 10,
                "rating": 3.0,
                "is_preferred": False,
                "phone": "555-9999",
                "email": "temp@delete.com"
            }
            create_res = client.post("/api/suppliers", json=temp_payload)
            assert create_res.status_code == 200
            temp_id = create_res.json()["id"]
            
            # Delete it
            del_res = client.delete(f"/api/suppliers/{temp_id}")
            assert del_res.status_code == 200, f"Supplier DELETE failed: {del_res.text}"
            print(f"-> Success: Deleted temporary supplier {temp_id}.")
            
            # Check not found
            check_res = client.get("/api/suppliers")
            current_ids = [s["id"] for s in check_res.json()]
            assert temp_id not in current_ids, "Supplier was not deleted from DB"
            print(f"-> Success: Verification confirmed supplier is gone.")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

        # 4. Test DELETE /api/inventory/{item_id}
        print("\n[Test 4] Testing Inventory Delete (DELETE)...")
        try:
            # Add a temp inventory item
            temp_item = {
                "sku": "TMP-ITM-99",
                "name": "Temporary Plastic Cups",
                "category": "Packaging",
                "quantity": 10,
                "reorder_point": 5,
                "reorder_quantity": 20,
                "overstock_threshold": 100,
                "unit_price": 0.5
            }
            create_res = client.post("/api/inventory", json=temp_item)
            assert create_res.status_code == 200
            temp_id = create_res.json()["id"]
            
            # Delete it
            del_res = client.delete(f"/api/inventory/{temp_id}")
            assert del_res.status_code == 200, f"Inventory DELETE failed: {del_res.text}"
            print(f"-> Success: Deleted temporary inventory item {temp_id}.")
            
            # Verify deleted
            check_res = client.get("/api/inventory")
            current_ids = [i["id"] for i in check_res.json()]
            assert temp_id not in current_ids, "Inventory item was not deleted"
            print(f"-> Success: Verification confirmed inventory item is gone.")
        except Exception as e:
            print(f"-> Failed: {e}")
            return False

    print("\n=========================================================")
    print("ALL NEW FEATURE TESTS PASSED SUCCESSFULLY!")
    print("=========================================================")
    return True

if __name__ == "__main__":
    if not run_new_tests():
        sys.exit(1)
