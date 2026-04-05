from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.services.chatbot.claude import ChatbotService
from app.services.chatbot.memory import append_to_history, fetch_history
import asyncio

router = APIRouter()
bot_service = ChatbotService()

from app.api.endpoints.students import MOCK_DB, EngineClass
from app.services.expert.facts import StudentData, Recommendation
from app.schemas.advisory import ChatMessageRequest, ChatMessageResponse

@router.post("/message", response_model=ChatMessageResponse)
async def post_message(payload: ChatMessageRequest):
    """
    REST-based fallback for chat messages if WebSocket (Code 1006) fails.
    """
    student_id = payload.student_id
    session_id = payload.session_id
    data = payload.message

    student_context = next((s for s in MOCK_DB if s["id"] == student_id), None)
    if not student_context:
        return ChatMessageResponse(role="assistant", content="Student context not found.")

    # 1. Quick FAQ Check
    hardcoded_reply = bot_service.intercept_predefined_query(data)
    if hardcoded_reply:
        append_to_history(session_id, "user", data)
        append_to_history(session_id, "assistant", hardcoded_reply)
        return ChatMessageResponse(role="assistant", content=hardcoded_reply)

    # 2. Logic Inference
    engine = EngineClass()
    engine.reset()
    engine.declare(StudentData(**student_context))
    engine.run()
    
    recommendations = []
    for fact in engine.facts.values():
        if isinstance(fact, Recommendation):
            recommendations.append({"rule_id": fact.get('rule_id'), "message": fact.get('message'), "category": fact.get('category')})

    # 3. AI Generation
    append_to_history(session_id, "user", data)
    sys_prompt = bot_service.synthesize_system_prompt(student_context, recommendations)
    response_content = bot_service.generate_response(session_id, data, sys_prompt)
    append_to_history(session_id, "assistant", response_content)

    return ChatMessageResponse(role="assistant", content=response_content)

@router.websocket("/ws/{student_id}/{session_id}")
async def websocket_endpoint(websocket: WebSocket, student_id: int, session_id: str):
    await websocket.accept()
    
    try:
        student_context = next((s for s in MOCK_DB if s["id"] == student_id), None)
        if not student_context:
            await websocket.close(code=1008) # Policy Violation
            return

        # Dynamically generate recommendations to pass to Claude
        engine = EngineClass()
        engine.reset()
        engine.declare(StudentData(**student_context))
        engine.run()
        
        recommendations = []
        for fact in engine.facts.values():
            if isinstance(fact, Recommendation):
                recommendations.append({"rule_id": fact.get('rule_id'), "message": fact.get('message'), "category": fact.get('category')})

        history = fetch_history(session_id)
        if not history:
            greeting = f"Hello {student_context['name'].split()[0]}, I'm ISAES. I notice your GPA is {student_context['cgpa']}. (Node {student_id} Verified). How can I assist?"
            append_to_history(session_id, "assistant", greeting)
            await websocket.send_json({"role": "assistant", "content": greeting})
        else:
            for msg in history:
                await websocket.send_json(msg)

        while True:
            data = await websocket.receive_text()
            
            # 1. Check for Predefined Interceptions
            hardcoded_reply = bot_service.intercept_predefined_query(data)
            if hardcoded_reply:
                append_to_history(session_id, "user", data)
                await websocket.send_json({"role": "assistant", "content": hardcoded_reply})
                append_to_history(session_id, "assistant", hardcoded_reply)
                continue

            # 2. General AI Generation
            append_to_history(session_id, "user", data)
            sys_prompt = bot_service.synthesize_system_prompt(student_context, recommendations)
            response_content = bot_service.generate_response(session_id, data, sys_prompt)
            
            await websocket.send_json({"role": "assistant", "content": response_content})
            append_to_history(session_id, "assistant", response_content)
            
    except WebSocketDisconnect:
        print(f"Chat Session {session_id} disconnected.")
    except Exception as e:
        print(f"CRITICAL CHAT ERROR: {e}")
        try:
            await websocket.send_json({"role": "assistant", "content": "I encountered a processing error in the Intelligence Core. Please retry shortly."})
        except: pass
        await websocket.close(code=1011) # Server Error
