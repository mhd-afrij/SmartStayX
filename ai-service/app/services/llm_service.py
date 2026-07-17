import json
from typing import AsyncGenerator
from openai import AsyncOpenAI
from app.config import settings
from app.utils.tools import TOOL_DEFINITIONS
from app.services.context_service import (
    search_hotels_db,
    get_available_rooms,
    get_hotel_details_db,
    get_user_bookings_db,
    create_service_request_db,
)

SYSTEM_PROMPT_TEMPLATE = """You are the SmartStayX Concierge, an expert AI hotel concierge and travel assistant.

YOUR CAPABILITIES:
- Hotel & Room Information: Search hotels, describe rooms, amenities, pricing, policies
- Booking Assistance: Check availability, explain pricing, help with bookings
- Guest Services: Process service requests (housekeeping, maintenance, room service)
- Local Area Knowledge: Recommend attractions, restaurants, activities
- Trip Planning: Create personalized itineraries
- Account Help: View bookings, check reservation status
- General Questions: Answer FAQs about check-in/out, amenities, hotel policies

PERSONALITY: Warm, professional, concise but thorough, proactive.

User context: {user_context}
Available hotels: {hotel_context}

IMPORTANT: When the user asks about bookings, hotels, or requests actions, use the available functions.
Keep responses conversational and concise. Be proactive in offering relevant suggestions."""


def _language_instruction(language: str | None, language_name: str | None) -> str:
    if not language and not language_name:
        return "Respond in the same language the user uses in the conversation."

    label = language_name or language or "the user's selected language"
    if language and language_name:
      return f"Respond only in {language_name} ({language})."
    return f"Respond only in {label}."


def _get_client() -> AsyncOpenAI:
    return AsyncOpenAI(
        api_key=settings.openai_api_key,
        base_url="https://openrouter.ai/api/v1",
    )


async def _execute_tool(name: str, args: dict, user_id: str | None) -> str:
    try:
        if name == "search_hotels":
            results = await search_hotels_db(args["query"], args.get("limit", 5))
            return json.dumps(results, default=str)
        elif name == "check_room_availability":
            results = await get_available_rooms(args["hotelId"], args["checkIn"], args["checkOut"])
            return json.dumps(results, default=str)
        elif name == "get_hotel_details":
            result = await get_hotel_details_db(args["hotelId"])
            return json.dumps(result, default=str) if result else "Hotel not found"
        elif name == "get_user_bookings":
            if not user_id:
                return "User not authenticated"
            results = await get_user_bookings_db(user_id)
            return json.dumps(results, default=str)
        elif name == "create_service_request":
            if not user_id:
                return "User not authenticated"
            result = await create_service_request_db(
                user_id, args["serviceType"], args["details"], args["hotelId"], args.get("roomNumber", "")
            )
            return json.dumps(result, default=str)
        elif name == "get_local_attractions":
            return json.dumps({"city": args["city"], "message": "Local attractions data available on the SmartStayX platform."})
        else:
            return json.dumps({"error": f"Unknown tool: {name}"})
    except Exception as e:
        return json.dumps({"error": str(e)})


async def generate_response(
    messages: list,
    user_id: str | None = None,
    user_context: str = "",
    hotel_context: str = "",
    language: str | None = None,
    language_name: str | None = None,
) -> str:
    client = _get_client()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        user_context=user_context or "Guest user",
        hotel_context=hotel_context or "No hotel data loaded",
    )
    system_prompt = f"{system_prompt}\n\nLANGUAGE RULE: {_language_instruction(language, language_name)}"

    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        openai_messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        response = await client.chat.completions.create(
            model=settings.ai_model,
            messages=openai_messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=1024,
        )

        choice = response.choices[0]
        if choice.finish_reason == "tool_calls" and choice.message.tool_calls:
            openai_messages.append({
                "role": "assistant",
                "content": choice.message.content or "",
                "tool_calls": [
                    {
                        "id": tc.id,
                        "type": "function",
                        "function": {
                            "name": tc.function.name,
                            "arguments": tc.function.arguments,
                        },
                    }
                    for tc in choice.message.tool_calls
                ],
            })
            for tool_call in choice.message.tool_calls:
                name = tool_call.function.name
                args = json.loads(tool_call.function.arguments)
                result = await _execute_tool(name, args, user_id)
                openai_messages.append({
                    "role": "tool",
                    "tool_call_id": tool_call.id,
                    "content": result,
                })

            final = await client.chat.completions.create(
                model=settings.ai_model,
                messages=openai_messages,
                temperature=0.7,
                max_tokens=1024,
            )
            return final.choices[0].message.content or ""

        return choice.message.content or ""

    except Exception as e:
        return f"I apologize, but I'm having trouble connecting to my knowledge base right now. Please try again in a moment. (Error: {str(e)})"


async def generate_streaming_response(
    messages: list,
    user_id: str | None = None,
    user_context: str = "",
    hotel_context: str = "",
    language: str | None = None,
    language_name: str | None = None,
) -> AsyncGenerator[str, None]:
    client = _get_client()

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        user_context=user_context or "Guest user",
        hotel_context=hotel_context or "No hotel data loaded",
    )
    system_prompt = f"{system_prompt}\n\nLANGUAGE RULE: {_language_instruction(language, language_name)}"

    openai_messages = [{"role": "system", "content": system_prompt}]
    for msg in messages:
        openai_messages.append({"role": msg["role"], "content": msg["content"]})

    try:
        stream = await client.chat.completions.create(
            model=settings.ai_model,
            messages=openai_messages,
            tools=TOOL_DEFINITIONS,
            tool_choice="auto",
            temperature=0.7,
            max_tokens=1024,
            stream=True,
        )

        tool_calls_buffer = {}
        collected_content = ""

        async for chunk in stream:
            delta = chunk.choices[0].delta if chunk.choices else None
            if not delta:
                continue

            if delta.tool_calls:
                for tc in delta.tool_calls:
                    idx = tc.index
                    if idx not in tool_calls_buffer:
                        tool_calls_buffer[idx] = {"id": "", "function": {"name": "", "arguments": ""}}
                    if tc.id:
                        tool_calls_buffer[idx]["id"] = tc.id
                    if tc.function:
                        if tc.function.name:
                            tool_calls_buffer[idx]["function"]["name"] += tc.function.name
                        if tc.function.arguments:
                            tool_calls_buffer[idx]["function"]["arguments"] += tc.function.arguments
                continue

            if delta.content:
                collected_content += delta.content
                yield delta.content

        if tool_calls_buffer:
            if collected_content:
                yield "\n\n"

            assistant_tc = []
            for idx in sorted(tool_calls_buffer.keys()):
                tc = tool_calls_buffer[idx]
                tc_data = {
                    "id": tc["id"],
                    "type": "function",
                    "function": {"name": tc["function"]["name"], "arguments": tc["function"]["arguments"]},
                }
                assistant_tc.append(tc_data)

            openai_messages.append({
                "role": "assistant",
                "content": collected_content or "",
                "tool_calls": assistant_tc,
            })

            for tc in assistant_tc:
                name = tc["function"]["name"]
                args = json.loads(tc["function"]["arguments"])
                result = await _execute_tool(name, args, user_id)
                openai_messages.append({
                    "role": "tool",
                    "tool_call_id": tc["id"],
                    "content": result or "No result",
                })

            final_stream = await client.chat.completions.create(
                model=settings.ai_model,
                messages=openai_messages,
                temperature=0.7,
                max_tokens=1024,
                stream=True,
            )
            async for chunk in final_stream:
                delta = chunk.choices[0].delta if chunk.choices else None
                if delta and delta.content:
                    yield delta.content

    except Exception as e:
        yield f"I apologize, but I'm having trouble connecting right now. Please try again. (Error: {str(e)})"
