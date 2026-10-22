# Database Schema & Entity Relationships
## Smart Cloud Resource Waste Detector

The data layer is modeled using SQLAlchemy 2.0 with foreign keys, cascading deletions, performance indices, and audit logging.

```mermaid
erDiagram
    USERS ||--o{ AUDIT_LOGS : performs
    CLOUD_RESOURCES ||--o{ RESOURCE_METRICS : records
    CLOUD_RESOURCES ||--o{ WASTE_FINDINGS : generates
    CLOUD_RESOURCES ||--o{ RECOMMENDATIONS : target
    CLOUD_RESOURCES ||--o{ ALERTS : triggers
    WASTE_FINDINGS ||--o{ RECOMMENDATIONS : causes

    USERS {
        int id PK
        string email UK
        string hashed_password
        string full_name
        string role
        boolean is_active
        datetime created_at
    }

    CLOUD_RESOURCES {
        int id PK
        string resource_id UK
        string name
        string provider
        string region
        string resource_type
        string environment
        string instance_size
        float cpu_utilization
        float memory_utilization
        float network_utilization
        float hourly_cost
        float monthly_cost
        string status
        boolean is_attached
        string optimization_status
        string source
        datetime last_activity
        datetime last_metrics_update
    }

    RESOURCE_METRICS {
        int id PK
        string resource_id FK
        datetime timestamp
        float cpu_percent
        float memory_percent
        float network_mbps
        float storage_gb
        string metrics_source
    }

    WASTE_FINDINGS {
        int id PK
        string finding_id UK
        string resource_id FK
        string category
        string severity
        string rule_triggered
        text observed_metrics
        text explanation
        float estimated_monthly_savings
        string confidence_level
        text suggested_next_step
        string review_status
        datetime detection_timestamp
    }

    RECOMMENDATIONS {
        int id PK
        string recommendation_id UK
        string resource_id FK
        string finding_id FK
        string title
        text suggested_action
        text current_configuration
        text evidence
        float estimated_monthly_savings
        string risk_level
        string confidence_level
        text operational_impact
        boolean required_human_approval
        text rollback_considerations
        string status
        string reviewed_by
        datetime reviewed_at
        text review_notes
    }

    ALERTS {
        int id PK
        string alert_id UK
        string resource_id FK
        string title
        text message
        string severity
        string alert_type
        boolean is_read
        string status
        datetime created_at
    }

    ANALYSIS_JOBS {
        int id PK
        string job_id UK
        string status
        int resources_analyzed
        int findings_generated
        float potential_savings
        datetime started_at
        datetime completed_at
    }
```

### Cascade & Integrity Guarantees
1. `ondelete="CASCADE"` on `ResourceMetric`, `WasteFinding`, `Recommendation`, and `Alert` ensures that deleting a decommissioned asset thoroughly purges associated telemetry without leaving orphaned foreign keys.
2. Composite index `ix_resource_metrics_res_time` on `(resource_id, timestamp)` accelerates multi-day time-series aggregation queries.
