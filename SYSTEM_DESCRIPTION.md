# PayCameroon System Functionality Description

PayCameroon is a comprehensive fintech platform designed to facilitate seamless financial transactions for various user types including Standard Users, Agents, Merchants, and various tiers of Administrators. Below is a detailed, exhaustive list of all functionalities available within the system, categorized by user persona.

## 1. Common Functionalities (Across All External Actors: Users, Agents, Merchants)
*   **Authentication & Onboarding**: Secure registration and login functionalities.
*   **PayChat / Support Center**: An integrated messaging system allowing users, agents, and merchants to communicate directly with support representatives for issue resolution.
*   **Notification System**: Real-time push and in-app notifications for transaction statuses, alerts, approvals, and system updates.
*   **Settings Management**: Ability to update profile information, change login passwords, modify transaction PINs, and toggle application language preferences.
*   **Transaction History**: View real-time logs of all personal or business transactions, with filtering capabilities.

## 2. Standard User Features (User Portal)
*   **KYC Verification**: Submit identification documents for compliance and account limit upgrades.
*   **Send & Request Money**: Transfer funds peer-to-peer (P2P) to other PayCameroon users instantly or request funds from them.
*   **QR Code Payments**: Scan dynamic QR codes to quickly pay merchants or send money to other users.
*   **Wallet Deposits (Cash In)**: Add funds to the PayCameroon wallet via external Mobile Money (MoMo) providers or bank cards.
*   **Wallet Withdrawals (Cash Out)**: Withdraw digital wallet funds into physical cash via an authorized PayCameroon Agent or Merchant, or transfer funds back to a Mobile Money account.
*   **Store & Utility Services**: Purchase new eSIMs, swap existing eSIMs across networks, and pay for standard utility bills directly from the wallet.
*   **Rate Comparison**: Compare current exchange and transaction rates across different Mobile Money operators in Cameroon.
*   **Statements**: Download detailed transaction statements for personal accounting and record-keeping.

## 3. Agent Features (Agent Dashboard)
*   **Process Cash In**: Accept physical cash from standard users and credit their digital PayCameroon wallets.
*   **Process Cash Out**: Disburse physical cash to standard users by deducting from their digital PayCameroon wallets.
*   **Float Management (Request Float)**: Request digital float (e-money) top-ups from the central platform treasury to continue processing cash-in operations.
*   **B2B Float Transfers**: Send digital float to other registered Agents or Merchants to help balance liquidity.
*   **Commission Tracking**: View real-time analytics and accrued commissions earned from processing deposits and withdrawals.
*   **Agent History**: View a dedicated ledger of all agency-level transactions processed for users.

## 4. Merchant Features (Merchant Dashboard)
*   **Payment Reception**: Receive payments for goods and services from users directly into their merchant wallet, either via direct transfer or QR code.
*   **Process Cash Out**: Act as liquidity points by allowing users to withdraw physical cash from their wallets via the merchant's business.
*   **Revenue Analytics**: Access graphical charts and data summarizing business revenue, transaction volumes, and customer payment trends.
*   **Wallet Withdrawals**: Request withdrawals of accumulated revenue from the merchant wallet to a corporate bank account or mobile money account (subject to Finance Admin approval).
*   **Commission Tracking**: Track additional commissions earned through specific system integrations or by processing user cash-outs.

## 5. Support Features (Support Dashboard)
*   **Ticket Management (PayChat)**: Receive, review, and reply to support messages and tickets submitted by users, agents, and merchants.
*   **User Directory Search**: Search for specific users, agents, or merchants using names, phone numbers, or PayCam ID.
*   **Profile & Transaction View**: Access read-only views of a user's profile and their specific transaction history to accurately debug and resolve customer complaints.

## 6. Compliance Features (Compliance Dashboard)
*   **KYC Management**: Review pending user KYC applications, inspect submitted ID documents, and either approve or reject their verified status.
*   **AML Monitoring**: Monitor AI-generated Anti-Money Laundering (AML) alerts and investigate suspicious account activities.
*   **Flagged Transactions**: Review specific transactions that have been flagged by the system for security risks or threshold breaches.
*   **Account Control**: Enforce security policies by temporarily freezing or permanently blocking user/agent/merchant accounts, as well as unblocking them when cleared.
*   **Audit Logs**: View immutable system audit logs detailing actions taken by administrators for accountability.

## 7. Finance Features (Finance / Treasury Dashboard)
*   **Platform Revenue Monitoring**: Track the total accrued revenue generated by the platform through transaction fees and service charges.
*   **Treasury Wallet Management**: Oversee internal system wallets (e.g., Revenue Wallet, Commission Wallet, Central Treasury) to ensure adequate liquidity.
*   **Global General Ledger**: View the consolidated accounting ledger of all money movements across the entire ecosystem.
*   **Approve Float Requests**: Review and authorize float requests made by Agents, disbursing e-money from the treasury to the agent's wallet.
*   **Approve Merchant Withdrawals**: Review and authorize revenue withdrawal requests from Merchants to their external bank accounts.
*   **System Financial Configuration**: Configure and update global transaction fees, taxation rates, and commission percentage splits for agents and merchants.
*   **Financial Reporting**: Generate and export comprehensive financial reports for accounting and executive review.

## 8. Super Admin Features (Admin Dashboard)
*   **System Configuration**: Configure core system parameters including application branding (logos), global security policies, global transaction fees, and commission settings (with the ability to save these configurations to the database).
*   **Global Oversight**: A bird's-eye view monitoring all KYC/AML activities, pending approvals, float requests, and aggregate revenue reports.
*   **Global Statistics**: View high-level metrics including total active users, transaction volume, system uptime, and total circulating supply.
*   **Bank Account Management**: Map and manage external corporate bank accounts tied to the platform's treasury.
*   **Global User Management**: Full administrative control to manage, edit, or audit any Standard User, Agent, or Merchant account on the platform.
*   **AI Threat Logs**: Access logs and alerts generated by the automated AI threat detection systems monitoring for fraudulent patterns.
*   **Global Transaction Logs**: Access the raw database logs of every single transaction executed on the network for ultimate traceability.
