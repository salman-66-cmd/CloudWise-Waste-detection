def test_create_and_get_resource(client):
    res_payload = {
        "resource_id": "test-vm-001",
        "name": "Integration Test VM",
        "provider": "AWS",
        "region": "us-east-1",
        "resource_type": "Virtual Machines",
        "environment": "Development",
        "instance_size": "t3.medium",
        "cpu_utilization": 3.2,
        "memory_utilization": 22.0,
        "network_utilization": 0.05,
        "hourly_cost": 0.0416,
        "status": "running",
        "is_attached": True
    }
    # Create resource
    create_res = client.post("/api/resources", json=res_payload)
    assert create_res.status_code == 200
    created_data = create_res.json()
    assert created_data["resource_id"] == "test-vm-001"
    assert created_data["monthly_cost"] > 0

    # Get resource
    get_res = client.get("/api/resources/test-vm-001")
    assert get_res.status_code == 200
    assert get_res.json()["name"] == "Integration Test VM"

def test_list_and_filter_resources(client):
    res = client.get("/api/resources?provider=AWS&page=1&page_size=10")
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data

def test_update_resource(client):
    patch_res = client.patch("/api/resources/test-vm-001", json={
        "instance_size": "t3.large",
        "hourly_cost": 0.0832
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["instance_size"] == "t3.large"

def test_csv_export(client):
    export_res = client.get("/api/resources/export/csv")
    assert export_res.status_code == 200
    assert "text/csv" in export_res.headers.get("content-type", "")
    assert "Resource ID" in export_res.text
