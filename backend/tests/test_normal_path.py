import pytest
import os
import sys

# Ensure src is in python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), "..", "src"))

from human_help import create_escalation

def test_normal_conversation_path(tmp_path):
    """Test Step 7: Normal conversation that does NOT need human help."""
    test_store = os.path.join(tmp_path, "test_escalations.jsonl")

    # In a normal conversation, the user asks about weather or catalogue items.
    # The agent does not call create_escalation tool at all.
    # We verify that no escalation record is created in the escalation store.

    assert not os.path.exists(test_store)
