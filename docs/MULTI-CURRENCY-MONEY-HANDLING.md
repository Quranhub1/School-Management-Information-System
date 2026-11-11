# Multi-currency money handling

## Current implementation

- UGX (en-UG) remains the SMIS default.
- Student invoices, payments, payment allocations, payment-ledger entries, fee structures and fee items already carry a currency code. Existing records are not rewritten and their currency is not inferred from the current institution setting.
- The frontend uses the shared formatCurrency helper backed by Intl.NumberFormat. It accepts a three-letter currency code and uses the currency's standard fraction digits and an appropriate locale default.
- Frontend exact minor-unit helpers use BigInt and decimal strings for exact add/subtract and conversion between major and minor units. Avoid converting a BigInt minor-unit amount to Number for ledger calculations.
- Backend finance calculations use .NET decimal. MoneyMath centralizes currency normalization, fraction digits, rounding, precision validation, explicit-rate conversion, and same-currency checks.
- Invoice creation validates fee-item currencies and precision before creating the invoice. Payment recording validates the entered amount against the invoice/payment currency precision. Existing allocation logic already rejects allocations where payment and invoice currencies differ.

## Currency safety rules

1. Never sum, compare, allocate, or report amounts across different currencies as if they were the same unit.
2. Do not apply a live or guessed exchange rate. A conversion must use an explicitly supplied rate and round to the target currency's fraction digits.
3. Preserve the original transaction currency on invoices, payments, allocations, and ledger entries. Changing the institution's default must not rewrite historical transactions.
4. Use decimal strings at JavaScript boundaries where exact decimal precision matters. JSON numeric values are IEEE-754 numbers once parsed by JavaScript.
5. Keep UGX as the default for new transactions unless the user explicitly selects another supported currency.

## Important deployment limitation

This change is a currency-safe foundation, not a complete exchange-rate administration workflow. The existing finance schema stores currency codes on transaction records, but it does not yet persist approved exchange-rate records or an institution-managed currency catalogue. In addition, several existing amount columns are configured as numeric(18,2); currencies requiring three fractional digits (for example KWD) must not be enabled for persisted finance transactions until a coordinated database precision migration is completed.

Do not treat the formatting helper or an exchange-rate calculation by itself as permission to settle an invoice in a different currency. A later exchange-rate workflow must persist the source currency, target currency, rate, rate timestamp/source, converted amount and rounding result, and must define the accounting entries for FX gains/losses.