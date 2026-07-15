# PayCameroon Activity Diagram Descriptions

This document provides detailed step-by-step textual descriptions for each of the core Activity Diagrams representing the PayCameroon system workflows. It breaks down the actions, decision points, and system behaviors in each sequence.

## 1. Authentication & Profile Management Flow
This flow details how users access the application and manage their account settings.
*   **Initial Action:** The user opens the PayCameroon application.
*   **Decision Point (Authentication Check):** The system checks if an active session exists.
    *   *If Logged In:* The user is routed directly to their respective Dashboard.
    *   *If Not Logged In (New User):* The user selects "Register", enters their phone number, password, and selects their role. They verify a One-Time Password (OTP), set up a 4-digit security PIN, and are routed to the Dashboard.
    *   *If Not Logged In (Existing User):* The user selects "Login", inputs credentials, and upon success, proceeds to the Dashboard.
*   **Settings Management:** From the Dashboard, a user can navigate to the Settings panel. Here, they can initiate three sub-activities: Update Password, Update PIN, or Change Language.
*   **Final Action:** Once changes are saved or applied, the user is seamlessly returned to their Dashboard.

## 2. KYC Submission & Compliance Review Flow
This flow illustrates the regulatory compliance pipeline for identity verification.
*   **Initial Action:** From the User Dashboard, an unverified user navigates to the KYC submission module.
*   **Document Upload:** The user uploads pictures of their national ID (front/back) and a live selfie. 
*   **Status Update:** The database updates the user's KYC status to 'Pending'.
*   **Compliance Queue:** A Compliance Officer opens their dashboard and sees the pending application in their queue.
*   **Decision Point (Document Review):** The officer inspects the submitted documents for authenticity.
    *   *If Approved:* The officer approves the application. The system updates the user's transaction limits (`kycVerified = true`) and sends a success notification.
    *   *If Rejected:* The officer flags the application with a specific rejection reason. The system sends a notification instructing the user to resubmit their documents.
*   **Final Action:** The workflow terminates when the notification is dispatched.

## 3. Peer-to-Peer (P2P) Transfer & AML Flow
This flow tracks the movement of money between standard users and the AI security checkpoints.
*   **Initial Action:** The sender initiates a transfer by entering the recipient's PayCam ID/Phone and the desired amount.
*   **Decision Point (Balance Check):** 
    *   *If Insufficient:* The system throws an error and the activity terminates.
    *   *If Sufficient:* The sender is prompted to enter their secure PIN.
*   **AML Gateway Check:** Upon PIN validation, the transaction is routed through the Anti-Money Laundering (AML) heuristics engine.
    *   *If Flagged (Suspicious):* The transaction is blocked and funds are held. An alert is generated and sent to the Compliance Dashboard for manual review. The activity terminates from the user's perspective.
    *   *If Cleared (Normal):* The system proceeds with the financial execution.
*   **Execution:** The system debits the sender's wallet, credits the recipient's wallet, calculates the platform tax/fee, and credits the platform's Revenue Wallet.
*   **Final Action:** Both sender and recipient receive real-time push notifications, completing the flow.

## 4. Cash-In (Deposit) Flow via Agent or MoMo
This flow explains how physical money or external mobile money enters the PayCameroon ecosystem.
*   **Initial Action:** The user selects their preferred deposit method.
*   **Mobile Money (MoMo) Path:** The user enters their external MoMo number and amount. The system triggers an external gateway prompt on the user's phone. If the user approves the MoMo PIN, the external funds are pulled, and their PayCameroon wallet is credited.
*   **Agent Path:** The user physically hands cash to a registered PayCameroon Agent.
    *   The Agent enters the user's ID and deposit amount on their dashboard.
    *   **Decision Point:** The system checks if the Agent has enough digital 'Float' to process the deposit.
        *   *If Insufficient:* The transaction fails.
        *   *If Sufficient:* The Agent confirms the deposit with their PIN.
    *   **Execution:** The system debits the Agent's float wallet and credits the user's wallet. The system then automatically calculates the Agent's commission and distributes it to the Agent.
*   **Final Action:** Both the user and agent receive completion notifications.

## 5. Cash-Out (Withdrawal) Flow via Agent/Merchant
This flow explains how users convert digital e-money back into physical cash.
*   **Initial Action:** The user initiates a withdrawal by scanning an Agent's or Merchant's QR code.
*   **Validation:** The user enters the amount and their PIN.
*   **Decision Point (Balance Check):** The system verifies the user has enough balance to cover the withdrawal amount plus any system fees.
    *   *If Insufficient:* The transaction fails.
    *   *If Sufficient:* The system debits the user's wallet.
*   **Execution:** The system calculates the commission owed to the Agent/Merchant for facilitating the cash-out. It credits the Agent's/Merchant's digital wallet with the principal withdrawal amount plus their earned commission.
*   **Physical Exchange:** The Agent or Merchant physically hands the corresponding cash to the user.
*   **Final Action:** System notifications are sent to both parties.

## 6. Merchant Payment & Revenue Withdrawal Flow
This flow tracks B2C commercial payments and how businesses extract their revenue.
*   **Payment Action:** A user scans a Merchant QR code, enters an amount and PIN, and the system processes the payment (debiting the user, crediting the merchant).
*   **Merchant Action:** As balance accumulates on the Merchant Dashboard, the merchant initiates a "Request Withdrawal" to move funds to their corporate Bank or MoMo account.
*   **Queueing:** The request is marked as 'Pending' and routed to the Finance Dashboard.
*   **Decision Point (Finance Approval):** The Finance Admin reviews the request.
    *   *If Rejected:* The requested funds are refunded back to the Merchant's PayCameroon wallet.
    *   *If Approved:* The Admin authorizes the external bank/MoMo wire. The system deducts any applicable platform withdrawal taxes, and marks the internal request as Complete.
*   **Final Action:** The merchant is notified of the outcome (approval or rejection).

## 7. Agent Float Request & B2B Transfer Flow
This flow details how Agents maintain their digital liquidity (Float).
*   **Float Request:** An Agent needs more digital float to perform Cash-In operations. They navigate to their dashboard and "Request Float", providing proof of a physical bank deposit made to the PayCameroon Corporate Treasury.
*   **Queueing:** The request is queued for the Finance Admin.
*   **Decision Point (Finance Approval):** 
    *   *If Rejected:* The request is discarded.
    *   *If Approved:* The Finance Admin triggers the system to debit the internal Treasury Wallet and credit the Agent's digital wallet with the requested float.
*   **B2B Transfer:** Alternatively, the Agent can perform a B2B "Send Float" transaction to another peer (Agent or Merchant). The system checks the sender's balance, debits them, and credits the recipient.
*   **Final Action:** Notifications are dispatched confirming the float allocation or transfer.

## 8. Store & Utility Services Flow
This flow handles the purchase of digital goods.
*   **Initial Action:** The user opens the Store interface and selects a service (Buy eSIM, Swap eSIM, or Pay Bills).
*   **Data Entry:** The user inputs specific requirements (e.g., selecting a data plan, picking a network to swap to, or entering a utility meter number).
*   **Validation:** The user confirms the purchase with their PIN. The system validates their wallet balance.
*   **Execution:** The system makes an API call to the external provider (e.g., telecom or utility company) to execute the service.
*   **Asset Delivery:** Upon success, the system generates the digital asset (e.g., a QR code for an eSIM) and debits the user's wallet.
*   **Final Action:** A success notification and receipt are sent to the user.

## 9. Support & PayChat System Flow
This flow outlines the customer service resolution pipeline.
*   **Ticket Creation:** A user, agent, or merchant opens PayChat and sends a message outlining their issue. The system automatically creates a Support Ticket marked as 'Open'.
*   **Support Queue:** A Support Representative views the open queue on their dashboard and opens the chat.
*   **Investigation:** The Rep reads the message. Using the dashboard's search tools, they investigate the user's transaction history or profile to identify the problem.
*   **Communication:** The Rep sends a reply via PayChat. The user receives the reply and the conversation continues asynchronously until the issue is fixed.
*   **Final Action:** The Support Rep marks the issue as resolved, closing the ticket.

## 10. Super Admin System Configuration Flow
This flow details how global variables are managed without code changes.
*   **Initial Action:** The Super Admin logs into their dashboard and navigates to the Settings/Configuration panel.
*   **Configuration Updates:** The Admin can perform actions such as updating global taxation fees, tweaking commission splits between the platform and agents, or updating application branding (logos/text).
*   **Database Save:** The Admin clicks save, committing the new configuration to the database.
*   **System Broadcast:** The system broadcasts the updated configuration across the platform, updating cached settings.
*   **Final Action:** All users and future transactions instantly adhere to the new fees and rules globally.
