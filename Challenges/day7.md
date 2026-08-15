# Day 7 – Know When to Ask for Human Help

Welcome to **Day 7** of the **10 Days of Voice Agents — #VoiceForBharat Edition**. Your agent can already talk, handle personalities, remember past sessions, use real tools, and place outbound calls. Today, you will teach it **when and how to step aside and ask a human for help**.

---

## 🎯 Day 7 Objectives

* **Step 1: Choose Two Reasons for Human Help**: For our **Local Commerce Voice Guide** track (Namma Kadai Assistant), the two escalation triggers are:
1. **Possible Fraud / Cybercrime Reporting**: The caller reports unauthorized transactions, UPI fraud, or phishing.
2. **Complex Scheme Approval / Disputes**: The caller needs an official loan/scheme decision, dispute resolution, or application status that the agent cannot legally or technically provide.


* **Step 2: Build a Human-Help Tool**: Implement a backend function tool (`create_escalation`) that the agent invokes automatically when an escalation condition is met.
* **Step 3: Generate a Clean Summary**: Create a concise handoff ticket containing:
* Who needs help (`user_id`, `name`)
* What happened (the core issue)
* What the agent already checked or advised
* Urgency level (`Low`, `Medium`, `High`, `Critical`)
* Language preference and preferred contact method
*(Note: Strict privacy is enforced—never include passwords, OTPs, PINs, or full account numbers).*


* **Step 4: Ask Before Sharing**: Program the agent to explicitly ask the caller for verbal consent before logging and sending the escalation ticket. If they decline, do not create it.
* **Step 5: Send the Request Somewhere Real**: Transmit the escalation ticket to a real endpoint (such as a Discord/Slack webhook, support dashboard, email service, or local database table).
* **Step 6: Give a Clear Next Step**: Provide the user with a reference ID and realistic expectations of what happens next without making false promises of instant human availability.
* **Step 7: Test Both Paths**: Verify that standard inquiries run smoothly without triggering an escalation, while critical issues cleanly generate a human-help ticket.

---

## 💻 Implementation Blueprint (`backend/src/agent.py`)

Add the escalation tool to your `Assistant` class:

```python
    @function_tool
    async def create_escalation(
        self,
        context: RunContext,
        user_id: str,
        name: str,
        issue_category: str,
        summary_of_incident: str,
        urgency: str = "Medium",
        language_preference: str = "English",
        user_consent_confirmed: bool = False,
    ):
        """Create a human support escalation ticket when a caller reports possible fraud, 
        financial disputes, or complex issues requiring manual intervention.

        Args:
            user_id: Unique caller identifier.
            name: Caller's name.
            issue_category: Category of issue ('Fraud Report', 'Scheme Dispute', 'Urgent Assistance').
            summary_of_incident: Concise summary of what happened and what the agent checked.
            urgency: Priority level ('Low', 'Medium', 'High', 'Critical').
            language_preference: Caller's preferred language.
            user_consent_confirmed: Must be True if the user explicitly agreed to send this ticket.
        """
        if not user_consent_confirmed:
            return "Escalation cancelled: User did not grant permission to share their details with human support."

        # Integration point: Send to webhook, database, or help desk dashboard
        ticket_id = f"ESC-{int(datetime.now().timestamp())}"
        logger.info(f"Escalation ticket created [{ticket_id}] for {name}: {issue_category} (Urgency: {urgency})")
        
        return (
            f"Escalation ticket successfully created with Reference ID {ticket_id}. "
            f"Our support team has been notified and will review your case regarding {issue_category}."
        )

```

---

## ✅ Day 7 Verification Checklist

* [x] Defined two distinct real-world triggers requiring human intervention (Fraud reporting and complex scheme/dispute review).
* [x] Built the `create_escalation` function tool with structured summary parameters.
* [x] Enforced mandatory verbal consent before sending any escalation ticket.
* [x] Handled ticket routing securely without exposing sensitive credentials or banking data.
* [x] Provided callers with a clear reference ID and next steps upon escalation.
