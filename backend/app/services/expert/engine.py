from experta import KnowledgeEngine, Rule, TEST, MATCH, Fact, DefFacts, AS
from typing import List, Dict, Any, Callable
from .facts import StudentData, Recommendation
from .loader import YamlRuleSchema

def build_condition_func(operator: str, value: Any) -> Callable:
    """ Maps string operators to python lambda predicates. """
    if operator == 'eq': return lambda x: x == value
    if operator == 'neq': return lambda x: x != value
    if operator == 'gt': return lambda x: x > value
    if operator == 'gte': return lambda x: x >= value
    if operator == 'lt': return lambda x: x < value
    if operator == 'lte': return lambda x: x <= value
    if operator == 'contains': return lambda x: any(v == value for v in x) if isinstance(x, list) else False
    return lambda x: x == value # fallback

def create_experta_rule_method(schema: YamlRuleSchema):
    """ Dynamically creates a bound method decorated with experta Rule. """
    
    # We construct the keyword arguments for StudentData matching
    # Experta uses MATCH for variable binding, and TEST for specific callables.
    # We will build predicates using MATCH and TEST.
    
    match_dict = {}
    test_funcs = []
    
    for cond in schema.conditions:
        # experta binding: field_name=MATCH.field_name
        # we can't easily dynamically bind to MATCH within dynamic args like this,
        # so instead we match the whole StudentData and run a custom TEST on it.
        pass

    # A simpler Experta approach for dynamic rules: 
    # Match any StudentData (AS.student << StudentData()), and use TEST
    @Rule(
        AS.student << StudentData(),
        TEST(lambda student: all(
            build_condition_func(c.operator, c.value)(student.get(c.field))
            for c in schema.conditions if student.get(c.field) is not None
        ))
    )
    def rule_action(self, student):
        self.declare(Recommendation(
            rule_id=schema.rule_id,
            risk_level=schema.conclusion.risk_level or "LOW",
            category=schema.conclusion.category or "risk",
            message=schema.conclusion.recommendation,
            action_tags=schema.conclusion.action_tags
        ))
    
    rule_action.__name__ = f"rule_{schema.rule_id}"
    rule_action.__doc__ = schema.description
    return rule_action

def create_engine_class(rules: List[YamlRuleSchema]):
    """ Dynamically constructs the KnowledgeEngine class given the YAML rules. """
    
    class_dict = {
        "__module__": __name__
    }
    
    for r in rules:
        class_dict[f"rule_{r.rule_id}"] = create_experta_rule_method(r)
        
    DynamicEngine = type("DynamicISAESEngine", (KnowledgeEngine,), class_dict)
    return DynamicEngine
