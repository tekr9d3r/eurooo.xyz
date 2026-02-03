import { getAddress } from 'viem';

/**
 * Normalizes an EVM address to its checksummed form.
 * Returns undefined if the input is empty or not a valid address.
 */
export function asAddress(value?: string | null): `0x${string}` | undefined {
  if (!value) return undefined;
  try {
    return getAddress(value) as `0x${string}`;
  } catch {
    return undefined;
  }
}
