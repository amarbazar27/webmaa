'use client';

import { useState, useMemo, useRef } from 'react';
import {
  Search, Download, Mail, MessageCircle, Globe, AlertCircle,
  WifiOff, CheckCircle2, ExternalLink, Phone, MapPin, Copy,
  Users, Send, Filter, RefreshCw, Zap, Target, X, Info,
  ChevronDown, ChevronUp, Eye, EyeOff
} from 'lucide-react';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const OFFER_WHATSAPP = `আস্সালামু আলাইকুম! আমি bdretailers.com থেকে বলছি। আপনার ব্যবসার জন্য মাত্র ১ মিনিটে একটি সুন্দর ওয়েবসাইট তৈরি করে দিতে পারি। বিনামূল্যে ডেমো দেখতে চাইলে জানান! 🛍️ bdretailers.com`;

const OFFER_EMAIL_SUBJECT = `আপনার ব্যবসার জন্য ১ মিনিটে ওয়েবসাইট — bdretailers.com`;
const OFFER_EMAIL_BODY = `আস্সালামু আলাইকুম,

আমি bdretailers.com থেকে বলছি। আমরা বাংলাদেশের ছোট ও মাঝারি ব্যবসার জন্য মাত্র ১ মিনিটে সুন্দর, পেশাদার ওয়েবসাইট তৈরি করি।

✅ কোনো Coding জ্ঞান লাগবে না
✅ নিজেই পণ্য যোগ করুন
✅ সম্পূর্ণ বাংলায়

বিনামূল্যে ডেমো দেখতে: https://bdretailers.com

ধন্যবাদ
bdretailers.com Team`;

const CATEGORIES = [
  'Camera Shop', 'Fashion Store', 'Clothing Store', 'Electronics Shop',
  'Grocery Store', 'Restaurant', 'Pharmacy', 'Furniture Shop',
  'Mobile Shop', 'Jewelry Shop', 'Shoe Store', 'Bakery',
  'Hardware Store', 'Book Shop', 'Optical Shop', 'Gift Shop'
];

const LOCATIONS = [
  'Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna',
  'Cumilla', 'Narayanganj', 'Gazipur', 'Mymensingh', 'Barishal'
];

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function formatPhone(phone) {
  if (!phone) return '';
  // Convert to BD format starting with +880
  let p = phone.replace(/[\s\-\(\)]/g, '');
  if (p.startsWith('01')) p = '+880' + p.slice(1);
  if (p.startsWith('880') && !p.startsWith('+')) p = '+' + p;
  return p;
}

function exportCSV(leads) {
  const headers = ['Name', 'Phone', 'Email', 'Address', 'Website', 'Website Status', 'Facebook'];
  const rows = leads.map(l => [
    `"${l.name}"`,
    `"${l.phone}"`,
    `"${l.email}"`,
    `"${l.address}"`,
    `"${l.websiteUrl}"`,
    `"${l.websiteStatus?.label}"`,
    `"${l.facebookUrl}"`,
  ]);
  const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `leads_${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function buildBulkEmailLink(leads) {
  const emails = leads.filter(l => l.email).map(l => l.email).join(',');
  if (!emails) return '';
  return `mailto:?bcc=${encodeURIComponent(emails)}&subject=${encodeURIComponent(OFFER_EMAIL_SUBJECT)}&body=${encodeURIComponent(OFFER_EMAIL_BODY)}`;
}

function buildWhatsAppLink(phone, msg = OFFER_WHATSAPP) {
  const p = formatPhone(phone).replace(/\D/g, '');
  return `https://wa.me/${p}?text=${encodeURIComponent(msg)}`;
}

// ─────────────────────────────────────────────
// Status Badge
// ─────────────────────────────────────────────
function StatusBadge({ status }) {
  if (status?.status === 'no_website') {
    return (
      <span className="leads-badge leads-badge-noweb">
        <WifiOff size={11} /> No Website
      </span>
    );
  }
  if (status?.status === 'broken') {
    return (
      <span className="leads-badge leads-badge-broken">
        <AlertCircle size={11} /> {status.label}
      </span>
    );
  }
  if (status?.status === 'working') {
    return (
      <span className="leads-badge leads-badge-working">
        <CheckCircle2 size={11} /> Working
      </span>
    );
  }
  return <span className="leads-badge leads-badge-unknown">Unknown</span>;
}

// ─────────────────────────────────────────────
// Lead Row
// ─────────────────────────────────────────────
function LeadRow({ lead, index, selected, onSelect }) {
  const phone = formatPhone(lead.phone);
  const waLink = phone ? buildWhatsAppLink(phone) : '';
  const emailLink = lead.email ? `mailto:${lead.email}?subject=${encodeURIComponent(OFFER_EMAIL_SUBJECT)}&body=${encodeURIComponent(OFFER_EMAIL_BODY)}` : '';
  const hasSiteUrl = lead.websiteUrl && !lead.websiteStatus?.working;

  return (
    <tr className={`leads-row ${selected ? 'leads-row-selected' : ''}`}>
      {/* Checkbox */}
      <td className="leads-td leads-td-check">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onSelect(lead.id)}
          className="leads-checkbox"
        />
      </td>

      {/* # */}
      <td className="leads-td leads-td-num">
        <span className="leads-num">{index + 1}</span>
      </td>

      {/* Business Name */}
      <td className="leads-td leads-td-name">
        <div className="leads-name">{lead.name}</div>
        {lead.address && (
          <div className="leads-addr">
            <MapPin size={10} /> {lead.address}
          </div>
        )}
      </td>

      {/* Phone */}
      <td className="leads-td">
        {phone ? (
          <a href={`tel:${phone}`} className="leads-contact-link leads-phone-link">
            <Phone size={12} /> {phone}
          </a>
        ) : (
          <span className="leads-empty">—</span>
        )}
      </td>

      {/* Email */}
      <td className="leads-td">
        {lead.email ? (
          <a href={emailLink} className="leads-contact-link leads-email-link">
            <Mail size={12} /> {lead.email}
          </a>
        ) : (
          <span className="leads-empty">—</span>
        )}
      </td>

      {/* Website Status */}
      <td className="leads-td">
        <div className="leads-site-cell">
          <StatusBadge status={lead.websiteStatus} />
          {hasSiteUrl && (
            <span className="leads-site-url-broken" title={lead.websiteUrl}>
              {lead.websiteUrl.length > 25 ? lead.websiteUrl.slice(0, 25) + '…' : lead.websiteUrl}
            </span>
          )}
          {lead.websiteStatus?.working && lead.websiteUrl && (
            <a href={lead.websiteUrl} target="_blank" rel="noreferrer" className="leads-site-link">
              <ExternalLink size={11} /> Visit
            </a>
          )}
        </div>
      </td>

      {/* Facebook */}
      <td className="leads-td">
        {lead.facebookUrl ? (
          <a href={lead.facebookUrl} target="_blank" rel="noreferrer" className="leads-fb-link">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            Facebook
          </a>
        ) : (
          <span className="leads-empty">—</span>
        )}
      </td>

      {/* Actions */}
      <td className="leads-td leads-td-actions">
        <div className="leads-actions-cell">
          {waLink && (
            <a
              href={waLink}
              target="_blank"
              rel="noreferrer"
              className="leads-action-btn leads-wa-btn"
              title="Send WhatsApp"
            >
              <MessageCircle size={13} />
              <span>WhatsApp</span>
            </a>
          )}
          {emailLink && (
            <a
              href={emailLink}
              className="leads-action-btn leads-email-btn"
              title="Send Email"
            >
              <Send size={13} />
              <span>Email</span>
            </a>
          )}
        </div>
      </td>
    </tr>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function LeadsPage() {
  const [query, setQuery] = useState('Camera Shop');
  const [location, setLocation] = useState('Dhaka');
  const [customQuery, setCustomQuery] = useState('');
  const [customLocation, setCustomLocation] = useState('');
  const [includeWorking, setIncludeWorking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [leads, setLeads] = useState([]);
  const [error, setError] = useState('');
  const [isDemo, setIsDemo] = useState(false);
  const [selected, setSelected] = useState(new Set());
  const [sortField, setSortField] = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [filterText, setFilterText] = useState('');
  const [showOffer, setShowOffer] = useState(false);

  const activeQuery = customQuery || query;
  const activeLocation = customLocation || location;

  // ── Search ──────────────────────────────────
  const handleSearch = async () => {
    setLoading(true);
    setError('');
    setLeads([]);
    setSelected(new Set());

    try {
      const res = await fetch('/api/leads/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: activeQuery, location: activeLocation, includeWorking })
      });

      const data = await res.json();

      if (data.error && !data.leads) {
        setError(data.error);
        return;
      }

      setLeads(data.leads || []);
      setIsDemo(data.demo || false);

      if (data.demo) {
        setError('⚠️ GOOGLE_MAPS_API_KEY নেই — Demo data দেখাচ্ছি। .env.local এ key add করুন।');
      }
    } catch (e) {
      setError('Search failed: ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  // ── Filtering & Sorting ──────────────────────
  const filteredLeads = useMemo(() => {
    let list = [...leads];
    if (filterText) {
      const q = filterText.toLowerCase();
      list = list.filter(l =>
        l.name?.toLowerCase().includes(q) ||
        l.phone?.includes(q) ||
        l.email?.toLowerCase().includes(q) ||
        l.address?.toLowerCase().includes(q)
      );
    }
    list.sort((a, b) => {
      const va = (a[sortField] || '').toString().toLowerCase();
      const vb = (b[sortField] || '').toString().toLowerCase();
      return sortDir === 'asc' ? va.localeCompare(vb) : vb.localeCompare(va);
    });
    return list;
  }, [leads, filterText, sortField, sortDir]);

  const selectedLeads = filteredLeads.filter(l => selected.has(l.id));
  const actionLeads = selectedLeads.length > 0 ? selectedLeads : filteredLeads;

  // ── Select helpers ───────────────────────────
  const toggleSelect = (id) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selected.size === filteredLeads.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filteredLeads.map(l => l.id)));
    }
  };

  // ── Sort ────────────────────────────────────
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <ChevronDown size={12} className="opacity-30" />;
    return sortDir === 'asc' ? <ChevronUp size={12} /> : <ChevronDown size={12} />;
  };

  // ── Bulk WhatsApp page ───────────────────────
  const openBulkWhatsApp = () => {
    const numbers = actionLeads.filter(l => l.phone).map(l => formatPhone(l.phone));
    if (!numbers.length) return alert('কোনো phone number নেই!');
    
    // Open each WA link in sequence (browser will open multiple tabs)
    const msg = encodeURIComponent(OFFER_WHATSAPP);
    numbers.forEach((num, i) => {
      const p = num.replace(/\D/g, '');
      setTimeout(() => {
        window.open(`https://wa.me/${p}?text=${msg}`, '_blank');
      }, i * 300);
    });
  };

  const bulkEmailLink = buildBulkEmailLink(actionLeads);

  const leadsWithPhone = filteredLeads.filter(l => l.phone).length;
  const leadsWithEmail = filteredLeads.filter(l => l.email).length;
  const leadsNoSite = filteredLeads.filter(l => l.websiteStatus?.status === 'no_website').length;
  const leadsBroken = filteredLeads.filter(l => l.websiteStatus?.status === 'broken').length;

  return (
    <>
      <style>{`
        /* ── Lead Gen Styles ── */
        .leads-page { font-family: 'Inter', system-ui, sans-serif; }

        /* Search Card */
        .leads-search-card {
          background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 50%, #0f172a 100%);
          border-radius: 20px;
          padding: 32px;
          margin-bottom: 24px;
          border: 1px solid rgba(99, 102, 241, 0.2);
          box-shadow: 0 0 60px rgba(99, 102, 241, 0.1);
          position: relative;
          overflow: hidden;
        }
        .leads-search-card::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 40%, rgba(99,102,241,0.08) 0%, transparent 60%);
          pointer-events: none;
        }
        .leads-search-title {
          font-size: 22px;
          font-weight: 800;
          color: #fff;
          margin-bottom: 4px;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .leads-search-sub {
          font-size: 12px;
          color: rgba(255,255,255,0.5);
          margin-bottom: 24px;
          letter-spacing: 0.05em;
        }
        .leads-search-grid {
          display: grid;
          grid-template-columns: 1fr 1fr auto auto;
          gap: 12px;
          align-items: end;
        }
        .leads-field-label {
          font-size: 11px;
          font-weight: 700;
          color: rgba(255,255,255,0.6);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 6px;
        }
        .leads-select, .leads-input {
          width: 100%;
          background: rgba(255,255,255,0.07);
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 10px;
          padding: 10px 14px;
          color: #fff;
          font-size: 13px;
          font-weight: 500;
          outline: none;
          transition: all 0.2s;
        }
        .leads-select option { background: #1e1b4b; color: #fff; }
        .leads-select:focus, .leads-input:focus {
          border-color: rgba(99,102,241,0.6);
          background: rgba(255,255,255,0.1);
          box-shadow: 0 0 0 3px rgba(99,102,241,0.15);
        }
        .leads-input::placeholder { color: rgba(255,255,255,0.3); }
        .leads-search-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 11px 28px;
          background: linear-gradient(135deg, #6366f1, #8b5cf6);
          color: #fff;
          border: none;
          border-radius: 10px;
          font-weight: 800;
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: all 0.2s;
          box-shadow: 0 4px 20px rgba(99,102,241,0.4);
        }
        .leads-search-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 25px rgba(99,102,241,0.5); }
        .leads-search-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
        .leads-check-label {
          display: flex;
          align-items: center;
          gap: 8px;
          color: rgba(255,255,255,0.7);
          font-size: 12px;
          cursor: pointer;
          user-select: none;
          margin-top: 12px;
        }
        .leads-check-label input { accent-color: #6366f1; }

        /* Stats */
        .leads-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .leads-stat {
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 14px;
          padding: 16px 20px;
          display: flex;
          align-items: center;
          gap: 12px;
          box-shadow: 0 2px 8px rgba(0,0,0,0.04);
        }
        .leads-stat-icon {
          width: 40px; height: 40px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .leads-stat-val { font-size: 22px; font-weight: 900; color: #0f172a; }
        .leads-stat-lbl { font-size: 11px; color: #94a3b8; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; }

        /* Toolbar */
        .leads-toolbar {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 16px;
          flex-wrap: wrap;
        }
        .leads-filter-input {
          flex: 1;
          min-width: 200px;
          background: #fff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 9px 14px;
          font-size: 13px;
          outline: none;
          color: #0f172a;
        }
        .leads-filter-input:focus { border-color: #6366f1; box-shadow: 0 0 0 3px rgba(99,102,241,0.1); }
        .leads-toolbar-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 9px 16px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: 700;
          cursor: pointer;
          border: none;
          transition: all 0.15s;
          white-space: nowrap;
          text-decoration: none;
        }
        .leads-btn-csv { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .leads-btn-csv:hover { background: #dcfce7; }
        .leads-btn-wa { background: #f0fdf4; color: #16a34a; border: 1px solid #bbf7d0; }
        .leads-btn-wa:hover { background: #dcfce7; }
        .leads-btn-email { background: #eff6ff; color: #2563eb; border: 1px solid #bfdbfe; }
        .leads-btn-email:hover { background: #dbeafe; }

        /* Table */
        .leads-table-wrap {
          background: #fff;
          border-radius: 16px;
          border: 1px solid #e2e8f0;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(0,0,0,0.06);
        }
        .leads-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
        }
        .leads-thead { background: #f8fafc; }
        .leads-th {
          padding: 12px 14px;
          text-align: left;
          font-size: 11px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          border-bottom: 1px solid #e2e8f0;
          white-space: nowrap;
          cursor: pointer;
          user-select: none;
        }
        .leads-th:hover { color: #6366f1; }
        .leads-th-inner { display: flex; align-items: center; gap: 4px; }
        .leads-row { border-bottom: 1px solid #f1f5f9; transition: background 0.1s; }
        .leads-row:hover { background: #fafafa; }
        .leads-row-selected { background: #eef2ff !important; }
        .leads-row:last-child { border-bottom: none; }
        .leads-td { padding: 12px 14px; vertical-align: middle; }
        .leads-td-check { width: 40px; }
        .leads-td-num { width: 40px; }
        .leads-td-name { min-width: 180px; }
        .leads-td-actions { width: 180px; }
        .leads-checkbox { width: 16px; height: 16px; accent-color: #6366f1; cursor: pointer; }
        .leads-num { font-size: 11px; color: #94a3b8; font-weight: 700; }
        .leads-name { font-weight: 700; color: #0f172a; font-size: 13px; margin-bottom: 2px; }
        .leads-addr { font-size: 11px; color: #94a3b8; display: flex; align-items: center; gap: 3px; }
        .leads-contact-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .leads-phone-link { color: #0f172a; background: #f1f5f9; }
        .leads-phone-link:hover { background: #e2e8f0; }
        .leads-email-link { color: #2563eb; background: #eff6ff; }
        .leads-email-link:hover { background: #dbeafe; }
        .leads-empty { color: #cbd5e1; font-size: 12px; }
        .leads-site-cell { display: flex; flex-direction: column; gap: 4px; }
        .leads-site-url-broken { font-size: 10px; color: #ef4444; font-family: monospace; }
        .leads-site-link {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          color: #6366f1;
          text-decoration: none;
          font-weight: 600;
        }
        .leads-site-link:hover { text-decoration: underline; }
        .leads-fb-link {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          font-size: 12px;
          color: #1877f2;
          text-decoration: none;
          font-weight: 600;
          background: #eff6ff;
          padding: 4px 8px;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .leads-fb-link:hover { background: #dbeafe; }

        /* Badges */
        .leads-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 700;
          white-space: nowrap;
        }
        .leads-badge-noweb { background: #fef3c7; color: #92400e; }
        .leads-badge-broken { background: #fee2e2; color: #991b1b; }
        .leads-badge-working { background: #d1fae5; color: #065f46; }
        .leads-badge-unknown { background: #f1f5f9; color: #64748b; }

        /* Actions */
        .leads-actions-cell { display: flex; gap: 6px; flex-wrap: wrap; }
        .leads-action-btn {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 5px 10px;
          border-radius: 7px;
          font-size: 11px;
          font-weight: 700;
          text-decoration: none;
          transition: all 0.15s;
          white-space: nowrap;
        }
        .leads-wa-btn { background: #dcfce7; color: #15803d; }
        .leads-wa-btn:hover { background: #bbf7d0; transform: translateY(-1px); }
        .leads-email-btn { background: #eff6ff; color: #1d4ed8; }
        .leads-email-btn:hover { background: #dbeafe; transform: translateY(-1px); }

        /* Error / Info */
        .leads-error {
          background: #fff7ed;
          border: 1px solid #fed7aa;
          border-radius: 12px;
          padding: 14px 18px;
          color: #9a3412;
          font-size: 13px;
          margin-bottom: 16px;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .leads-empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
        }
        .leads-empty-icon { font-size: 48px; margin-bottom: 12px; }

        /* Offer preview */
        .leads-offer-card {
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 14px;
          padding: 20px;
          margin-top: 16px;
        }
        .leads-offer-title { font-size: 12px; font-weight: 800; color: #15803d; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.05em; }
        .leads-offer-text { font-size: 13px; color: #166534; white-space: pre-wrap; line-height: 1.6; }

        /* Demo banner */
        .leads-demo-banner {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          border: 1px solid #f59e0b;
          border-radius: 12px;
          padding: 12px 18px;
          margin-bottom: 16px;
          font-size: 12px;
          color: #92400e;
          font-weight: 600;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        /* Selection bar */
        .leads-selection-bar {
          background: #eef2ff;
          border: 1px solid #c7d2fe;
          border-radius: 10px;
          padding: 10px 16px;
          font-size: 12px;
          color: #4338ca;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 10px;
        }

        @media (max-width: 768px) {
          .leads-search-grid { grid-template-columns: 1fr; }
          .leads-stats { grid-template-columns: repeat(2, 1fr); }
          .leads-table-wrap { overflow-x: auto; }
        }
      `}</style>

      <div className="leads-page">
        {/* ── Header ── */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div style={{
              width: 44, height: 44,
              background: 'linear-gradient(135deg, #6366f1, #8b5cf6)',
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Target size={22} color="#fff" />
            </div>
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 900, color: '#0f172a', margin: 0 }}>
                Lead Generation
              </h1>
              <p style={{ fontSize: 12, color: '#64748b', margin: 0, fontWeight: 600 }}>
                Facebook-only businesses খুঁজে বের করো • bdretailers.com offer পাঠাও
              </p>
            </div>
          </div>
        </div>

        {/* ── Search Card ── */}
        <div className="leads-search-card">
          <div className="leads-search-title">
            <Zap size={20} color="#a5b4fc" />
            Business খোঁজা শুরু করো
          </div>
          <div className="leads-search-sub">
            যে category এবং location এ search করতে চাও সেটা select করো
          </div>

          <div className="leads-search-grid">
            {/* Category */}
            <div>
              <div className="leads-field-label">Category / Business Type</div>
              <select
                className="leads-select"
                value={customQuery ? 'custom' : query}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  setQuery(e.target.value);
                  setCustomQuery('');
                }}
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                <option value="custom">✏️ Custom...</option>
              </select>
              {(customQuery !== undefined) && (
                <input
                  type="text"
                  className="leads-input"
                  style={{ marginTop: 6 }}
                  placeholder="Custom category লিখুন..."
                  value={customQuery}
                  onChange={(e) => setCustomQuery(e.target.value)}
                />
              )}
            </div>

            {/* Location */}
            <div>
              <div className="leads-field-label">Location / City</div>
              <select
                className="leads-select"
                value={customLocation ? 'custom' : location}
                onChange={(e) => {
                  if (e.target.value === 'custom') return;
                  setLocation(e.target.value);
                  setCustomLocation('');
                }}
              >
                {LOCATIONS.map(l => <option key={l} value={l}>{l}</option>)}
                <option value="custom">✏️ Custom...</option>
              </select>
              {(customLocation !== undefined) && (
                <input
                  type="text"
                  className="leads-input"
                  style={{ marginTop: 6 }}
                  placeholder="Custom location লিখুন..."
                  value={customLocation}
                  onChange={(e) => setCustomLocation(e.target.value)}
                />
              )}
            </div>

            {/* Search Button */}
            <div>
              <div className="leads-field-label">&nbsp;</div>
              <button
                className="leads-search-btn"
                onClick={handleSearch}
                disabled={loading}
              >
                {loading ? (
                  <><RefreshCw size={16} className="spin" /> Searching...</>
                ) : (
                  <><Search size={16} /> Search Leads</>
                )}
              </button>
            </div>

            {/* Options */}
            <div>
              <div className="leads-field-label">&nbsp;</div>
              <label className="leads-check-label">
                <input
                  type="checkbox"
                  checked={includeWorking}
                  onChange={(e) => setIncludeWorking(e.target.checked)}
                />
                Working site-ও দেখাও
              </label>
            </div>
          </div>

          {/* Offer preview toggle */}
          <div style={{ marginTop: 16 }}>
            <button
              onClick={() => setShowOffer(v => !v)}
              style={{
                background: 'none', border: 'none', color: '#a5b4fc',
                fontSize: 12, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6
              }}
            >
              <Info size={13} />
              Offer Message Preview {showOffer ? '▲' : '▼'}
            </button>
            {showOffer && (
              <div className="leads-offer-card" style={{ marginTop: 10 }}>
                <div className="leads-offer-title">📱 WhatsApp Offer Message</div>
                <div className="leads-offer-text">{OFFER_WHATSAPP}</div>
                <div className="leads-offer-title" style={{ marginTop: 14 }}>📧 Email Subject</div>
                <div className="leads-offer-text">{OFFER_EMAIL_SUBJECT}</div>
                <div className="leads-offer-title" style={{ marginTop: 14 }}>📧 Email Body</div>
                <div className="leads-offer-text">{OFFER_EMAIL_BODY}</div>
              </div>
            )}
          </div>
        </div>

        {/* ── Demo Banner ── */}
        {isDemo && (
          <div className="leads-demo-banner">
            <AlertCircle size={16} />
            Demo Mode: GOOGLE_MAPS_API_KEY নেই। .env.local এ <code>GOOGLE_MAPS_API_KEY=your_key</code> add করুন।
          </div>
        )}

        {/* ── Error ── */}
        {error && !isDemo && (
          <div className="leads-error">
            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
            {error}
          </div>
        )}

        {/* ── Results ── */}
        {filteredLeads.length > 0 && (
          <>
            {/* Stats */}
            <div className="leads-stats">
              <div className="leads-stat">
                <div className="leads-stat-icon" style={{ background: '#eef2ff' }}>
                  <Target size={18} color="#6366f1" />
                </div>
                <div>
                  <div className="leads-stat-val">{filteredLeads.length}</div>
                  <div className="leads-stat-lbl">Total Leads</div>
                </div>
              </div>
              <div className="leads-stat">
                <div className="leads-stat-icon" style={{ background: '#fef3c7' }}>
                  <WifiOff size={18} color="#d97706" />
                </div>
                <div>
                  <div className="leads-stat-val">{leadsNoSite}</div>
                  <div className="leads-stat-lbl">No Website</div>
                </div>
              </div>
              <div className="leads-stat">
                <div className="leads-stat-icon" style={{ background: '#fee2e2' }}>
                  <AlertCircle size={18} color="#dc2626" />
                </div>
                <div>
                  <div className="leads-stat-val">{leadsBroken}</div>
                  <div className="leads-stat-lbl">Broken Site</div>
                </div>
              </div>
              <div className="leads-stat">
                <div className="leads-stat-icon" style={{ background: '#d1fae5' }}>
                  <Phone size={18} color="#059669" />
                </div>
                <div>
                  <div className="leads-stat-val">{leadsWithPhone}</div>
                  <div className="leads-stat-lbl">With Phone</div>
                </div>
              </div>
            </div>

            {/* Toolbar */}
            <div className="leads-toolbar">
              <Filter size={14} color="#94a3b8" />
              <input
                type="text"
                className="leads-filter-input"
                placeholder="Filter by name, phone, email, address..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
              />

              <button
                className="leads-toolbar-btn leads-btn-wa"
                onClick={openBulkWhatsApp}
                title={`${actionLeads.filter(l=>l.phone).length} জনকে WhatsApp`}
              >
                <MessageCircle size={13} />
                Bulk WhatsApp ({actionLeads.filter(l=>l.phone).length})
              </button>

              {bulkEmailLink && (
                <a
                  href={bulkEmailLink}
                  className="leads-toolbar-btn leads-btn-email"
                  title={`${actionLeads.filter(l=>l.email).length} জনকে Email`}
                >
                  <Mail size={13} />
                  Bulk Email ({actionLeads.filter(l=>l.email).length})
                </a>
              )}

              <button
                className="leads-toolbar-btn leads-btn-csv"
                onClick={() => exportCSV(actionLeads)}
              >
                <Download size={13} />
                CSV Export
              </button>
            </div>

            {/* Selection info */}
            {selected.size > 0 && (
              <div className="leads-selection-bar">
                <CheckCircle2 size={14} />
                {selected.size} lead selected — Bulk actions শুধু selected leads এ apply হবে
                <button
                  onClick={() => setSelected(new Set())}
                  style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#6366f1', fontWeight: 700, fontSize: 12 }}
                >
                  Clear
                </button>
              </div>
            )}

            {/* Table */}
            <div className="leads-table-wrap">
              <table className="leads-table">
                <thead className="leads-thead">
                  <tr>
                    <th className="leads-th">
                      <input
                        type="checkbox"
                        className="leads-checkbox"
                        checked={selected.size === filteredLeads.length && filteredLeads.length > 0}
                        onChange={selectAll}
                      />
                    </th>
                    <th className="leads-th">#</th>
                    <th className="leads-th" onClick={() => handleSort('name')}>
                      <div className="leads-th-inner">Business Name <SortIcon field="name" /></div>
                    </th>
                    <th className="leads-th" onClick={() => handleSort('phone')}>
                      <div className="leads-th-inner">Phone <SortIcon field="phone" /></div>
                    </th>
                    <th className="leads-th" onClick={() => handleSort('email')}>
                      <div className="leads-th-inner">Email <SortIcon field="email" /></div>
                    </th>
                    <th className="leads-th">Website Status</th>
                    <th className="leads-th">Facebook</th>
                    <th className="leads-th">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeads.map((lead, i) => (
                    <LeadRow
                      key={lead.id}
                      lead={lead}
                      index={i}
                      selected={selected.has(lead.id)}
                      onSelect={toggleSelect}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            {/* Bottom Bulk Actions */}
            <div style={{
              marginTop: 20,
              background: 'linear-gradient(135deg, #0f172a, #1e1b4b)',
              borderRadius: 16,
              padding: '20px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              flexWrap: 'wrap',
              border: '1px solid rgba(99,102,241,0.2)'
            }}>
              <div style={{ color: '#a5b4fc', fontSize: 13, fontWeight: 800, flex: 1 }}>
                <Zap size={14} style={{ display: 'inline', marginRight: 6 }} />
                Bulk Actions — {selectedLeads.length > 0 ? `${selectedLeads.length} selected leads` : `All ${filteredLeads.length} leads`}
              </div>
              <button
                onClick={openBulkWhatsApp}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px',
                  background: 'linear-gradient(135deg, #16a34a, #15803d)',
                  color: '#fff', border: 'none', borderRadius: 10,
                  fontWeight: 800, fontSize: 13, cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(22,163,74,0.4)'
                }}
              >
                <MessageCircle size={15} />
                Open All WhatsApp ({actionLeads.filter(l=>l.phone).length})
              </button>
              {bulkEmailLink && (
                <a
                  href={bulkEmailLink}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                    color: '#fff', borderRadius: 10,
                    fontWeight: 800, fontSize: 13, textDecoration: 'none',
                    boxShadow: '0 4px 15px rgba(37,99,235,0.4)'
                  }}
                >
                  <Send size={15} />
                  Send Bulk Email ({actionLeads.filter(l=>l.email).length})
                </a>
              )}
              <button
                onClick={() => exportCSV(actionLeads)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '10px 20px',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#e2e8f0', border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: 10, fontWeight: 800, fontSize: 13, cursor: 'pointer',
                }}
              >
                <Download size={15} />
                Export CSV
              </button>
            </div>
          </>
        )}

        {/* ── Empty State ── */}
        {!loading && leads.length === 0 && !error && (
          <div className="leads-empty-state">
            <div className="leads-empty-icon">🎯</div>
            <div style={{ fontWeight: 700, color: '#475569', fontSize: 16, marginBottom: 8 }}>
              Search করুন — Leads পাবেন
            </div>
            <div style={{ fontSize: 13 }}>
              Category আর Location select করে Search বোতাম চাপুন
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 20px' }}>
            <div style={{
              width: 48, height: 48,
              border: '4px solid #e2e8f0',
              borderTopColor: '#6366f1',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 16px'
            }} />
            <div style={{ fontWeight: 700, color: '#475569', fontSize: 15 }}>Searching businesses...</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>
              Website status check হচ্ছে, একটু অপেক্ষা করুন...
            </div>
          </div>
        )}

        <style>{`
          @keyframes spin { to { transform: rotate(360deg); } }
          .spin { animation: spin 1s linear infinite; }
        `}</style>
      </div>
    </>
  );
}
