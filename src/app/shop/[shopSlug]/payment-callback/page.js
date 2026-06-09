import CallbackUI from './CallbackUI';

// Server Component — safely awaits params and searchParams
export default async function PaymentCallbackPage({ params, searchParams }) {
  const { shopSlug } = await params;
  const { orderId, shopId, status, txnId } = await searchParams;

  return (
    <CallbackUI
      shopSlug={shopSlug}
      orderId={orderId || ''}
      shopId={shopId || ''}
      status={status || 'failed'}
      txnId={txnId || ''}
    />
  );
}
