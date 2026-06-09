import SandboxUI from './SandboxUI';

// Server Component — safely awaits params and searchParams
export default async function PaymentSandboxPage({ params, searchParams }) {
  const { shopSlug } = await params;
  const { orderId, shopId, amount } = await searchParams;

  return (
    <SandboxUI
      shopSlug={shopSlug}
      orderId={orderId || ''}
      shopId={shopId || ''}
      amountParam={amount || ''}
    />
  );
}
