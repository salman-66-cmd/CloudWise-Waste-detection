def test_mock_targets_healthy(client):
    res_api = client.get("/api/mock-targets/healthy")
    assert res_api.status_code == 200
    assert res_api.json()["status"] == "healthy"

    res_v1 = client.get("/api/v1/mock-targets/healthy")
    assert res_v1.status_code == 200
    assert res_v1.json()["status"] == "healthy"

def test_mock_targets_error(client):
    res_api = client.get("/api/mock-targets/error")
    assert res_api.status_code == 500

    res_v1 = client.get("/api/v1/mock-targets/error")
    assert res_v1.status_code == 500
