import os
import sys
import tempfile
import asyncio
from db import init_db, get_caller, save_caller
from agent import Assistant, RunContext

def test_sqlite_memory():
    with tempfile.NamedTemporaryFile(suffix=".db", delete=False) as tmp:
        db_path = tmp.name

    try:
        init_db(db_path)

        # 1. Lookup non-existent user
        res = get_caller("Ramesh", db_path=db_path)
        assert res is None, "Should return None for non-existent caller"

        # 2. Try saving without consent
        refused = save_caller(
            user_id="ramesh_01",
            name="Ramesh",
            language_preference="Hindi",
            facts={"past_orders": "Cotton sarees", "usual_quantities": "50 units"},
            user_consent_confirmed=False,
            db_path=db_path
        )
        assert refused["status"] == "error", "Saving without consent must fail"

        # Verify nothing was saved
        res_after_refusal = get_caller("Ramesh", db_path=db_path)
        assert res_after_refusal is None, "Caller should not exist in database"

        # 3. Save with explicit consent
        saved = save_caller(
            user_id="ramesh_01",
            name="Ramesh",
            language_preference="Hindi",
            facts={"past_orders": "Cotton sarees", "usual_quantities": "50 units"},
            user_consent_confirmed=True,
            db_path=db_path
        )
        assert saved["status"] == "success", "Saving with consent must succeed"

        # 4. Lookup existing user by name
        record = get_caller("Ramesh", db_path=db_path)
        assert record is not None, "Caller record should be retrieved"
        assert record["user_id"] == "ramesh_01"
        assert record["name"] == "Ramesh"
        assert record["facts"]["past_orders"] == "Cotton sarees"

        # 5. Lookup existing user by ID
        record_id = get_caller("ramesh_01", db_path=db_path)
        assert record_id is not None
        assert record_id["name"] == "Ramesh"

        print("ALL SQLITE CALLER MEMORY TESTS PASSED SUCCESSFULLY!")
    finally:
        try:
            if os.path.exists(db_path):
                os.remove(db_path)
        except Exception:
            pass

async def test_weather_tool():
    assistant = Assistant()
    ctx = None  # RunContext is passed by LiveKit runtime during function calls
    
    print("\n--- Testing Weather Tool (Valid City: Chennai) ---")
    weather_res = await assistant.get_current_weather(ctx, "Chennai")
    print("Result:", weather_res)
    assert "Chennai" in weather_res
    assert "as of" in weather_res

    print("\n--- Testing Weather Tool (Invalid City: NonExistentCityX123) ---")
    invalid_res = await assistant.get_current_weather(ctx, "NonExistentCityX123")
    print("Result:", invalid_res)
    assert "could not locate" in invalid_res

    print("ALL WEATHER TOOL TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    test_sqlite_memory()
    asyncio.run(test_weather_tool())
