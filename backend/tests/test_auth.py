def test_health_check(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "online"
    assert data["database"] == "healthy"

def test_login_success(client):
    response = client.post("/api/auth/login", json={
        "email": "admin@cloudwise.io",
        "password": "DemoAdmin123!"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "admin@cloudwise.io"

def test_login_invalid_credentials(client):
    response = client.post("/api/auth/login", json={
        "email": "testadmin@cloudwise.io",
        "password": "WrongPassword!"
    })
    assert response.status_code == 401

def test_user_registration(client):
    import uuid
    test_email = f"user_{uuid.uuid4().hex[:6]}@cloudwise.io"
    response = client.post("/api/auth/register", json={
        "email": test_email,
        "password": "NewUserPass123!",
        "full_name": "New Regular User",
        "role": "standard"
    })
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == test_email
    assert data["role"] == "standard"
