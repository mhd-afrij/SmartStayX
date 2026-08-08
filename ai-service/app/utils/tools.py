TOOL_DEFINITIONS = [
    {
        "type": "function",
        "function": {
            "name": "search_hotels",
            "description": "Search for hotels by city or hotel name",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "City name or hotel name to search for"},
                    "limit": {"type": "integer", "description": "Maximum number of results", "default": 5},
                },
                "required": ["query"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "check_room_availability",
            "description": "Check room availability for a specific hotel on given dates",
            "parameters": {
                "type": "object",
                "properties": {
                    "hotelId": {"type": "string", "description": "Hotel MongoDB ID"},
                    "checkIn": {"type": "string", "description": "Check-in date (YYYY-MM-DD)"},
                    "checkOut": {"type": "string", "description": "Check-out date (YYYY-MM-DD)"},
                },
                "required": ["hotelId", "checkIn", "checkOut"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_hotel_details",
            "description": "Get detailed information about a specific hotel",
            "parameters": {
                "type": "object",
                "properties": {
                    "hotelId": {"type": "string", "description": "Hotel MongoDB ID"},
                },
                "required": ["hotelId"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_bookings",
            "description": "Get the current user's booking history and upcoming stays",
            "parameters": {
                "type": "object",
                "properties": {},
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "create_service_request",
            "description": "Create a new service request (housekeeping, maintenance, room service)",
            "parameters": {
                "type": "object",
                "properties": {
                    "serviceType": {
                        "type": "string",
                        "enum": ["Housekeeping", "Maintenance", "Room Service", "Front Desk"],
                        "description": "Type of service requested",
                    },
                    "details": {"type": "string", "description": "Description of the request"},
                    "hotelId": {"type": "string", "description": "Hotel MongoDB ID"},
                    "roomNumber": {"type": "string", "description": "Room number"},
                },
                "required": ["serviceType", "details", "hotelId"],
            },
        },
    },
    {
        "type": "function",
        "function": {
            "name": "get_local_attractions",
            "description": "Get popular attractions and restaurants near a destination",
            "parameters": {
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "category": {
                        "type": "string",
                        "enum": ["attractions", "restaurants", "all"],
                        "default": "all",
                    },
                },
                "required": ["city"],
            },
        },
    },
]
