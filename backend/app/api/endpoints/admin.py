from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
import os
import yaml

router = APIRouter()

RULES_DIR = os.path.join(os.path.dirname(__file__), "../../../rules")

class RuleUpdatePayload(BaseModel):
    filename: str
    yaml_content: str

@router.get("/rules")
def get_all_rules():
    """ Read all current YAML files in the local Knowledge Base """
    files = {}
    if not os.path.exists(RULES_DIR):
        return {"rules": files}
        
    for filename in os.listdir(RULES_DIR):
        if filename.endswith(('.yaml', '.yml')):
            filepath = os.path.join(RULES_DIR, filename)
            with open(filepath, 'r') as file:
                files[filename] = file.read()
    return {"rules": files}

@router.put("/rules")
def update_rule_file(payload: RuleUpdatePayload):
    """ Overwrite or create a new YAML rule definitions file securely """
    if not payload.filename.endswith(('.yaml', '.yml')):
        raise HTTPException(status_code=400, detail="Must be a .yaml or .yml file")
        
    filepath = os.path.join(RULES_DIR, payload.filename)
    
    # Simple syntax validation check before writing blind data
    try:
        yaml.safe_load(payload.yaml_content)
    except yaml.YAMLError as exc:
        raise HTTPException(status_code=422, detail=f"Invalid YAML Syntax: {exc}")
        
    with open(filepath, 'w') as file:
        file.write(payload.yaml_content)
        
    # Note: In a production scale env, here we would optionally trigger an Event 
    # to softly reload the Experta KnowledgeEngine dynamically in memory.
    return {"status": "success", "message": f"Updated {payload.filename}"}
