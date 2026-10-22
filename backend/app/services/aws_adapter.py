import logging
import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings

logger = logging.getLogger(__name__)

class AWSAdapter:
    """
    Optional read-only AWS adapter for scanning EC2 instances, CloudWatch metrics, and EBS volumes.
    Works seamlessly without credentials by reporting credential status and preventing crashes.
    """
    def __init__(self):
        self.access_key = settings.AWS_ACCESS_KEY_ID
        self.secret_key = settings.AWS_SECRET_ACCESS_KEY
        self.region = settings.AWS_DEFAULT_REGION
        self.enabled = settings.AWS_ENABLED

    def get_connection_status(self) -> Dict[str, Any]:
        """
        Check if AWS credentials are provided in environment variables without leaking them.
        """
        has_credentials = bool(self.access_key and self.secret_key)
        return {
            "configured": has_credentials,
            "region": self.region,
            "enabled": self.enabled,
            "mode": "live_aws" if (has_credentials and self.enabled) else "simulated_local",
            "message": "AWS credentials configured in environment." if has_credentials else "Running in safe local simulation mode (no AWS credentials provided)."
        }

    def sync_resources(self) -> Dict[str, Any]:
        """
        Attempt to connect to AWS with boto3 if configured.
        Gracefully returns detailed status without throwing unhandled exceptions.
        """
        if not (self.access_key and self.secret_key and self.enabled):
            return {
                "success": False,
                "error": "AWS credentials not configured or AWS_ENABLED is false. Operating in local simulation mode.",
                "imported_count": 0
            }

        try:
            import boto3
            from botocore.exceptions import NoCredentialsError, ClientError

            ec2_client = boto3.client(
                "ec2",
                region_name=self.region,
                aws_access_key_id=self.access_key,
                aws_secret_access_key=self.secret_key
            )

            # Describe EC2 instances (Read-Only)
            response = ec2_client.describe_instances()
            imported_instances = []
            for reservation in response.get("Reservations", []):
                for instance in reservation.get("Instances", []):
                    inst_id = instance.get("InstanceId")
                    inst_type = instance.get("InstanceType")
                    state = instance.get("State", {}).get("Name", "running")
                    tags = {t["Key"]: t["Value"] for t in instance.get("Tags", [])}
                    name = tags.get("Name", f"aws-ec2-{inst_id}")
                    
                    imported_instances.append({
                        "resource_id": inst_id,
                        "name": name,
                        "provider": "AWS",
                        "region": self.region,
                        "resource_type": "Virtual Machines",
                        "instance_size": inst_type,
                        "status": state,
                        "source": "aws"
                    })

            return {
                "success": True,
                "message": f"Successfully retrieved {len(imported_instances)} instances from AWS {self.region}.",
                "instances": imported_instances,
                "imported_count": len(imported_instances)
            }

        except Exception as e:
            logger.warning(f"AWS synchronization failed safely: {str(e)}")
            return {
                "success": False,
                "error": f"AWS connection failed: {str(e)}",
                "imported_count": 0
            }
