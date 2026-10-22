def test_simulator_and_waste_detection(client):
    # Trigger simulator
    sim_res = client.post("/api/metrics/simulator/run?force_reset=true")
    assert sim_res.status_code == 200
    sim_data = sim_res.json()
    assert sim_data["simulator"]["status"] == "success"
    assert sim_data["analysis_job"]["findings_generated"] > 0
    assert sim_data["analysis_job"]["potential_savings"] > 0

    # Fetch findings
    findings_res = client.get("/api/analysis/findings")
    assert findings_res.status_code == 200
    findings = findings_res.json()
    assert len(findings) > 0
    first = findings[0]
    assert "finding_id" in first
    assert "explanation" in first
    assert "estimated_monthly_savings" in first

def test_recommendation_workflow(client):
    # Fetch recommendations
    recs_res = client.get("/api/recommendations")
    assert recs_res.status_code == 200
    recs = recs_res.json()
    assert len(recs) > 0
    rec_id = recs[0]["recommendation_id"]

    # Update recommendation review status to "Approved"
    patch_res = client.patch(f"/api/recommendations/{rec_id}", json={
        "status": "Approved",
        "review_notes": "Verified with development team that this instance can be stopped."
    })
    assert patch_res.status_code == 200
    assert patch_res.json()["status"] == "Approved"
    assert patch_res.json()["review_notes"] is not None

def test_dashboard_summary_metrics(client):
    dash_res = client.get("/api/dashboard/summary")
    assert dash_res.status_code == 200
    dash_data = dash_res.json()
    assert dash_data["total_resources"] > 0
    assert dash_data["estimated_monthly_cost"] > 0
    assert dash_data["potential_monthly_savings"] > 0
    assert len(dash_data["top_wasteful_resources"]) > 0
    assert len(dash_data["trends"]) > 0
