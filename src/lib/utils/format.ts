export function formatNumber(value: number) {
  return new Intl.NumberFormat('id-ID').format(value);
}
