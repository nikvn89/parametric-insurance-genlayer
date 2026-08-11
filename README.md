# 🛡️ Parametric Insurance Intelligent Contract (GenLayer)

**Contract (GenVM StudioNet):** `0xBBe6878AE9fd87a2759FDD65a19cB553e154B217`  
**Explorer:** https://explorer-studio.genlayer.com/address/0xBBe6878AE9fd87a2759FDD65a19cB553e154B217  
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
| **Claim-Protected Expiry** | Provider can only expire an ACTIVE policy if no claim has been filed — expiry is permanently blocked once `file_claim()` is called |
| **Bounded Schema Validation** | Leader result fully validated (score clamped 0–100, rationale non-empty ≤ 280 chars) before consumption |
| **Validator Schema Check** | `validator_fn` validates leader schema before comparing bands |

---

## 🔐 Security Architecture

1. **Caller-Authorization** — Only the Insured can file a claim; only Provider or Insured can trigger adjudication; only Provider can withdraw/expire.
2. **Claim-Protected Expiry** — `expire_policy()` checks `claim_url` and reverts if a claim has been filed. Provider cannot expire a policy to escape a pending claim and reclaim funds unfairly.
3. **Graceful Fail-Closed Web Fetching** — 404s and timeouts default to `FETCH_FAILED_NETWORK_ERROR`, scoring 0.
4. **Prompt Injection Fencing** — All scraped content is stripped of XML tags and fenced in `<UNTRUSTED_SUBMISSION>` blocks.
5. **Semantic Banding Consensus** — `validator_fn` maps score ≥ 50 → `Approved`, < 50 → `Denied`, ensuring perfect consensus across non-deterministic validators.
6. **Re-entrancy Protection** — `payout_amount` zeroed before `gl.transfer()` in `withdraw_denied_policy()`.

---

## 📋 Contract Methods

| Method | Who | Description |
|---|---|---|
| `create_policy(insured, criteria, domains)` | Provider (payable) | Creates a funded policy |
| `file_claim(policy_id, news_url)` | Insured | Files a claim with a trusted news URL |
| `adjudicate_claim(policy_id)` | Provider or Insured | Triggers AI adjudication |
| `expire_policy(policy_id)` | Provider | Marks ACTIVE policy as EXPIRED — **blocked if a claim has been filed** |
| `withdraw_denied_policy(policy_id)` | Provider | Withdraws funds from DENIED or EXPIRED policy |
| `get_policy(policy_id)` | Anyone | Returns policy state as JSON |
| `get_all_policies()` | Anyone | Returns all policies |

---

## 🧪 Policy Lifecycle

```
create_policy (ACTIVE)
      ↓
file_claim → adjudicate_claim
      ↓                ↓
PAYOUT_APPROVED    CLAIM_DENIED
(insured paid)          ↓
                 withdraw_denied_policy
                 (provider reclaims funds)

OR (no claim filed):
expire_policy → EXPIRED → withdraw_denied_policy

NOTE: expire_policy is permanently blocked once file_claim() is called.
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
- ✅ Adjudication bound to provider or insured
- ✅ Withdrawal bound to provider only
- ✅ `expire_policy` blocked if `claim_url` is set — provider cannot escape a pending claim
- ✅ Leader result schema validated before consumption (score + rationale bounds)
- ✅ Validator schema validated before band comparison
- ✅ Re-entrancy protected in withdrawal
- ✅ Division/zero-fund guard in withdrawal
