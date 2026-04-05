import yaml
import os
from pydantic import BaseModel
from typing import List, Any, Dict, Optional

class RuleCondition(BaseModel):
    field: str
    operator: str # eq, neq, gt, lt, gte, lte
    value: Any

class RuleConclusion(BaseModel):
    risk_level: Optional[str] = "LOW"
    category: Optional[str] = "risk" # risk, improvement
    recommendation: str
    action_tags: List[str] = []

class YamlRuleSchema(BaseModel):
    rule_id: str
    name: str
    description: str
    conditions: List[RuleCondition]
    conclusion: RuleConclusion
    priority: int = 0

def load_rules_from_yaml(directory_path: str) -> List[YamlRuleSchema]:
    """ Loads YAML files and validates them against the Pydantic schema """
    rules = []
    if not os.path.exists(directory_path):
        return rules
        
    for filename in os.listdir(directory_path):
        if filename.endswith(('.yaml', '.yml')):
            filepath = os.path.join(directory_path, filename)
            with open(filepath, 'r') as file:
                data = yaml.safe_load(file)
                if isinstance(data, list):
                    for r_data in data:
                        rules.append(YamlRuleSchema(**r_data))
                elif isinstance(data, dict):
                    rules.append(YamlRuleSchema(**data))
    return rules
