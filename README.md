# 🛡️ Parametric Insurance Intelligent Contract (GenLayer)

**Contract (GenVM StudioNet):** `0xEc1D1dEb15E9c2b5e75e35bE178d9619B35cC56C`  
**Explorer:** https://explorer-studio.genlayer.com/address/0xEc1D1dEb15E9c2b5e75e35bE178d9619B35cC56C  
**GitHub:** https://github.com/nikvn89/parametric-insurance-genlayer

---

## 🌟 Overview

A fully on-chain **Parametric Insurance Intelligent Contract** built natively for GenLayer (GenVM). Unlike traditional parametric insurance that relies on rigid, centralized oracles (like Chainlink), this contract uses GenLayer's decentralized LLM Validator network to independently fetch real-world news and semantically adjudicate whether an insured event (e.g., a hurricane, a flight cancellation, a drought) actually occurred.

---

## 🚀 Key Features

| Feature | Implementation |
|---|---|
| **Decentralized AI Adjuster** | LLM reads the web and outputs a severity score (0–100) based strictly on objective evidence |
| **Automated Payouts** | If consensus score ≥ 50, payout is transferred atomically to the insured |
| **Refund / Withdrawal** | Provider can withdraw funds after `CLAIM_DENIED` or `EXPIRED` via `withdraw_denied_policy()` |
| **Enforceable Expiry Window** | `expiry_at` is set at policy creation; `expire_policy()` reverts if the coverage window is still open — provider cannot close the policy early |
| **Claim-Protected Expiry** | `expire_policy()` permanently blocked once `file_claim()` is called — provider cannot escape a pending claim |
| **Bounded Schema Validation** | Leader result fully validated (score clamped 0–100, rationale non-empty ≤ 280 chars) before consumption |
| **Validator Schema Check** | `validator_fn` validates leader schema before comparing bands |

---

## 🔐 Security Architecture

1. **Caller-Authorization** — Only the Insured can file a claim; only Provider or Insured can trigger adjudication; only Provider can withdraw/expire.
2. **Enforceable Expiry Window** — `create_policy()` requires an `expiry_at` ISO-8601 timestamp. `expire_policy()` reverts if `now < expiry_at` — provider cannot expire a policy while it is still within the coverage window.
3. **Claim-Protected Expiry** — `expire_policy()` checks `claim_url` and reverts if a claim has been filed. Provider cannot expire to escape a pending claim or adjudication.
4. **Graceful Fail-Closed Web Fetching** — 404s and timeouts default to `FETCH_FAILED_NETWORK_ERROR`, scoring 0.
5. **Prompt Injection Fencing** — All scraped content is stripped of XML tags and fenced in `<UNTRUSTED_SUBMISSION>` blocks.
6. **Semantic Banding Consensus** — `validator_fn` maps score ≥ 50 → `Approved`, < 50 → `Denied`, ensuring perfect consensus across non-deterministic validators.
7. **Re-entrancy Protection** — `payout_amount` zeroed before transfer in both `adjudicate_claim()` and `withdraw_denied_policy()`.

---

## 📋 Contract Methods

| Method | Who | Description |
|---|---|---|
| `create_policy(insured, criteria, domains_json, expiry_at)` | Provider (payable) | Creates a funded policy with a coverage window deadline |
| `file_claim(policy_id, news_url)` | Insured | Files a claim — only allowed before `expiry_at` |
| `adjudicate_claim(policy_id)` | Provider or Insured | Triggers AI adjudication |
| `expire_policy(policy_id)` | Provider | Marks policy EXPIRED — **only after `expiry_at` and only if no claim filed** |
| `withdraw_denied_policy(policy_id)` | Provider | Withdraws funds from DENIED or EXPIRED policy |
| `get_policy(policy_id)` | Anyone | Returns policy state as JSON |
| `get_all_policies()` | Anyone | Returns all policies |

---

## 🧪 Policy Lifecycle

```
create_policy (ACTIVE, expiry_at set)
      ↓
file_claim (only before expiry_at) → adjudicate_claim
      ↓                                      ↓
PAYOUT_APPROVED                         CLAIM_DENIED
(insured paid)                               ↓
                                  withdraw_denied_policy
                                  (provider reclaims funds)

OR (no claim filed AND now >= expiry_at):
expire_policy → EXPIRED → withdraw_denied_policy

BLOCKED: expire_policy reverts if now < expiry_at (window still open)
BLOCKED: expire_policy reverts if claim_url is set (claim pending)
```

---

## 📁 Files

```
├── ParametricInsurance.py    # GenLayer Intelligent Contract (V4)
├── deploy.mjs                # Deployment script
└── README.md
```

---

## 🔐 Security Properties Verified

- ✅ Claim filing bound to `gl.message.sender_address == insured`
- ✅ Claim filing blocked after `expiry_at` — coverage window enforced
- ✅ Adjudication bound to provider or insured
- ✅ Withdrawal bound to provider only
- ✅ `expire_policy` reverts if `now < expiry_at` — provider cannot expire early (verified on-chain)
- ✅ `expire_policy` reverts if `claim_url` is set — provider cannot escape pending claim (verified on-chain)
- ✅ Leader result schema validated before consumption (score + rationale bounds)
- ✅ Validator schema validated before band comparison
- ✅ Re-entrancy protected in both `adjudicate_claim` and `withdraw_denied_policy`
- ✅ `NativePayout.emit_transfer` used for EOA payouts (no `gl.transfer`/`bigint`)
- ✅ `trusted_domains` passed as JSON string, parsed in contract (no list calldata)
