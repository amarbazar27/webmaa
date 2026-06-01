export const metadata = {
  title: 'টেমপ্লেট মার্কেটপ্লেস — Daripallah Dashboard',
  description: 'আপনার স্টোরের জন্য প্রিমিয়াম টেমপ্লেট বেছে নিন',
};

// Server component — just renders the client wrapper
import TemplatePageClient from './TemplatePageClient';

export default function TemplatePage() {
  return <TemplatePageClient />;
}
