const DEFAULT_FEE_PERCENT = 0.029;
const DEFAULT_FEE_FIXED_CENTS = 30;

function sanitizePercent(value: number) {
  if (!Number.isFinite(value) || value < 0 || value >= 1) {
    return DEFAULT_FEE_PERCENT;
  }
  return value;
}

function sanitizeFixedCents(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return DEFAULT_FEE_FIXED_CENTS;
  }
  return Math.round(value);
}

export function getStripeFeeConfig() {
  const passFeesToPlayer = process.env.STRIPE_PASS_FEES_TO_PLAYER !== 'false';
  const feePercent = sanitizePercent(
    Number(process.env.STRIPE_FEE_PERCENT ?? DEFAULT_FEE_PERCENT)
  );
  const feeFixedCents = sanitizeFixedCents(
    Number(process.env.STRIPE_FEE_FIXED_CENTS ?? DEFAULT_FEE_FIXED_CENTS)
  );

  return {
    passFeesToPlayer,
    feePercent,
    feeFixedCents,
  };
}

export function calculateStripePaymentAmounts(baseAmountCents: number) {
  const sanitizedBaseAmount = Math.max(0, Math.round(baseAmountCents));
  const { passFeesToPlayer, feePercent, feeFixedCents } = getStripeFeeConfig();

  if (!passFeesToPlayer || sanitizedBaseAmount === 0) {
    return {
      baseAmountCents: sanitizedBaseAmount,
      feeAmountCents: 0,
      totalAmountCents: sanitizedBaseAmount,
      passFeesToPlayer,
      feePercent,
      feeFixedCents,
    };
  }

  const grossAmount = Math.ceil(
    (sanitizedBaseAmount + feeFixedCents) / (1 - feePercent)
  );
  const feeAmountCents = Math.max(0, grossAmount - sanitizedBaseAmount);

  return {
    baseAmountCents: sanitizedBaseAmount,
    feeAmountCents,
    totalAmountCents: sanitizedBaseAmount + feeAmountCents,
    passFeesToPlayer,
    feePercent,
    feeFixedCents,
  };
}

export function centsToEuro(cents: number) {
  return Math.round(cents) / 100;
}
