# Day 9 – Hand Off to a Specialist Agent

Welcome to **Day 9** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. Your main agent handles general inquiries, profile memory, tools, outbound calls, and human escalation. Today, you will establish a clean multi-agent architecture by introducing a **specialist agent** and executing seamless handoffs.

---

## 🎯 Day 9 Objectives

* **Step 1: Choose Your Specialist Domain**: For our **Local Commerce Voice Guide** track (Namma Kadai Assistant), the main triage agent handles general onboarding, financial literacy, and basic scheme overviews. When a user needs deep technical help regarding fraud investigation or cybersecurity complaints, the conversation is handed off to a **Cyber Safety & Fraud Specialist Agent**.
* **Step 2: Create the Specialist as a Separate Agent**: Define a focused specialist subclass with strict instructions and a narrow scope (e.g., investigating suspicious UPI links, guiding cybercrime reporting steps via the National Cyber Crime Reporting Portal).
* **Step 3: Add a Handoff Tool to the Main Agent**: Implement a dedicated function tool (`transfer_to_fraud_specialist`) on the main agent with a precise docstring so the LLM knows exactly when to execute the transfer.
* **Step 4: Pass the Conversation & Context**: Ensure the specialist inherits the ongoing conversation history (`chat_ctx`) so the user never has to repeat themselves.
* **Step 5: Make the Handoff Clear**: Program the main agent to announce the transition out loud (*"I will connect you to our cyber safety and fraud prevention specialist"*), and have the specialist introduce itself immediately upon taking over.

---

## 💻 Implementation Blueprint (`backend/src/agent.py`)

Here is how you implement multi-agent handoffs using the LiveKit Agents framework:

```python
from livekit.agents import Agent, AgentSession, RunContext, function_tool
from livekit.agents.llm import handoff

# 1. Define the Specialist Agent
class FraudSpecialistAgent(Agent):
    def __init__(self, chat_ctx=None):
        super().__init__(
            instructions=(
                "You are an expert Cyber Safety and Fraud Prevention Specialist for Tamil Nadu Financial Services. "
                "Your sole job is to help users who have encountered UPI fraud, phishing scams, fake loan apps, or compromised credentials. "
                "Give calm, precise, actionable guidance. Instruct them on calling the National Cybercrime Helpline (1930) "
                "and filing reports on cybercrime.gov.in. Keep answers brief and speakable."
            ),
            chat_ctx=chat_ctx
        )

    async def on_enter(self) -> None:
        # Specialist introduces itself right after taking over
        await self.session.generate_reply(
            instructions="Introduce yourself as the cyber safety specialist and ask the user to describe the suspicious incident safely."
        )

# 2. Main Triage Agent with Handoff Tool
class MainTriageAgent(Agent):
    def __init__(self) -> None:
        super().__init__(
            instructions=(
                "You are Kathirvelan Karthik, a friendly Digital Financial Assistant for Tamil Nadu. "
                "Help users with general financial literacy, budgeting, and basic government scheme inquiries. "
                "If the user reports active financial fraud, unauthorized deductions, or cyber scams, "
                "you MUST immediately notify them that you are transferring them to our security expert."
            )
        )

    @function_tool
    async def transfer_to_fraud_specialist(self, context: RunContext):
        """Transfer the conversation to the Cyber Safety and Fraud Specialist agent 
        when the user reports active online fraud, cyber scams, unauthorized UPI transactions, or phishing links.
        """
        # Announce handoff intention before executing transfer
        await context.session.generate_reply(
            instructions="Say: 'I will connect you to our cyber safety and fraud prevention specialist right away.'"
        )
        
        # Instantiate specialist passing the active chat context for continuity
        specialist = FraudSpecialistAgent(chat_ctx=context.session._chat_ctx)
        return handoff(agent=specialist)

```

---

## ✅ Day 9 Verification Checklist

* [x] Created a focused specialist agent (`FraudSpecialistAgent`) with distinct system instructions.
* [x] Added a clear handoff function tool (`transfer_to_fraud_specialist`) to the main triage agent.
* [x] Passed active conversation context (`chat_ctx`) so the specialist seamlessly maintains history.
* [x] Verified that the main agent announces the transfer clearly and the specialist self-introduces upon taking control.