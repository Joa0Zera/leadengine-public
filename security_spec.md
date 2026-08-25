# Security Specifications (TDD Spec)

## Data Invariants
1. **Lead Integrity**: Every lead must have a valid `id`, a descriptive `name`, and an associated `category` and `city`.
2. **Template Validation**: Every site template must specify the `niche` and point to a valid Netlify, Vercel, or custom subdomain demo `url`.
3. **Financial Transparency**: Financial projects must register a positive numeric value (`value > 0`), a non-empty `companyName`, and a valid live website `url`.
4. **Offline/Public Operations**: Because the application operates primarily as a standalone professional workspace without a login barrier, CRUD operations are allowed publicly while adhering strictly to structure and size constraints.

## The Dirty Dozen Payloads (Vulnerability Vector Audit)
1. **Lead Shadow Injection**: Injecting unsolicited administrative fields like `isCloudAdmin` into the Lead document.
2. **Lead ID Spoofing**: Overwriting lead document fields with invalid string patterns or path manipulation.
3. **Template Excess String Attack**: Setting the `niche` field to a massive 1MB string to exploit database storage costs.
4. **Negative Revenue Exploit**: Creating a financial project with a negative cost value (`value = -15000`) to skew reporting tools.
5. **Junk URL Attack**: Saving raw malicious JavaScript or invalid URI strings in place of the template or project `url`.
6. **Mismatched ID Creation**: Attempting to save a document where the nested property `id` differs from the database Document ID path.
7. **Malformed Lead Tags**: Overloading lead tags with a massive array to exceed Firestore document constraints.
8. **Null Category Insertion**: Saving a lead with an empty or non-string category value.
9. **Malformed Ratings**: Attempting to save a Rating value outside the permissible standard bounds of [0, 5].
10. **Zero-value Project Sale**: Creating a faturamento entry without a valid value or with `value = 0`.
11. **Empty Niche Template**: Adding a site template with an empty `niche` value.
12. **Mismatched Timestamps**: Creating entries with futures/past dates that do not match current or realistic bounds.

## Test Matrix Verification
- All "Dirty Dozen" invalid schema payloads will be blocked by type-safety validators embedded within the `firestore.rules`.
