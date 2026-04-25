'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { getShop, updateShop } from '@/lib/firestore';
import { uploadShopLogo } from '@/lib/storage';
import { 
  Store, Globe, Phone, Text, Save, Image as ImageIcon, ShieldCheck, 
  Info, Link2, AlertTriangle, Check, Sparkles, MessageSquare, Truck, Users, Gift, X,
  MapPin, Clock, Plus, ChevronDown
} from 'lucide-react';
import { Card, Input, Button } from '@/components/ui';
import toast from 'react-hot-toast';

// Bangladesh Districts (partial list â€” key ones)
const BD_DISTRICTS = [
  'à¦¢à¦¾à¦•à¦¾', 'à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®', 'à¦°à¦¾à¦œà¦¶à¦¾à¦¹à§€', 'à¦–à§à¦²à¦¨à¦¾', 'à¦¬à¦°à¦¿à¦¶à¦¾à¦²', 'à¦¸à¦¿à¦²à§‡à¦Ÿ', 'à¦°à¦‚à¦ªà§à¦°', 'à¦®à§Ÿà¦®à¦¨à¦¸à¦¿à¦‚à¦¹',
  'à¦•à§à¦®à¦¿à¦²à§à¦²à¦¾', 'à¦¨à¦¾à¦°à¦¾à§Ÿà¦£à¦—à¦žà§à¦œ', 'à¦—à¦¾à¦œà§€à¦ªà§à¦°', 'à¦œà¦¾à¦®à¦¾à¦²à¦ªà§à¦°', 'à¦¨à§‹à§Ÿà¦¾à¦–à¦¾à¦²à§€', 'à¦«à§‡à¦¨à§€', 'à¦¬à¦¿à¦•à§à¦°à¦®à¦ªà§à¦°',
  'à¦®à¦¾à¦¦à¦¾à¦°à§€à¦ªà§à¦°', 'à¦—à§‹à¦ªà¦¾à¦²à¦—à¦žà§à¦œ', 'à¦•à¦¿à¦¶à§‹à¦°à¦—à¦žà§à¦œ', 'à¦¹à¦¬à¦¿à¦—à¦žà§à¦œ', 'à¦®à§Œà¦²à¦­à§€à¦¬à¦¾à¦œà¦¾à¦°', 'à¦¸à§à¦¨à¦¾à¦®à¦—à¦žà§à¦œ',
  'à¦ªà¦žà§à¦šà¦—à§œ', 'à¦ à¦¾à¦•à§à¦°à¦—à¦¾à¦à¦“', 'à¦¦à¦¿à¦¨à¦¾à¦œà¦ªà§à¦°', 'à¦¨à§€à¦²à¦«à¦¾à¦®à¦¾à¦°à§€', 'à¦•à§à§œà¦¿à¦—à§à¦°à¦¾à¦®', 'à¦²à¦¾à¦²à¦®à¦¨à¦¿à¦°à¦¹à¦¾à¦Ÿ',
  'à¦¬à¦—à§à§œà¦¾', 'à¦œà§Ÿà¦ªà§à¦°à¦¹à¦¾à¦Ÿ', 'à¦šà¦¾à¦à¦ªà¦¾à¦‡à¦¨à¦¬à¦¾à¦¬à¦—à¦žà§à¦œ', 'à¦°à¦¾à¦œà¦¬à¦¾à§œà§€', 'à¦°à¦¾à¦™à¦¾à¦®à¦¾à¦Ÿà¦¿', 'à¦–à¦¾à¦—à§œà¦¾à¦›à§œà¦¿',
  'à¦¬à¦¾à¦¨à§à¦¦à¦°à¦¬à¦¾à¦¨', 'à¦šà¦¾à¦à¦¦à¦ªà§à¦°', 'à¦²à¦•à§à¦·à§à¦®à§€à¦ªà§à¦°', 'à¦¶à¦°à§€à¦¯à¦¼à¦¤à¦ªà§à¦°', 'à¦ªà¦¿à¦°à§‹à¦œà¦ªà§à¦°', 'à¦–à§à¦²à¦¨à¦¾', 'à¦¸à¦¾à¦¤à¦•à§à¦·à§€à¦°à¦¾', 'à¦¬à¦¾à¦—à§‡à¦°à¦¹à¦¾à¦Ÿ',
  'à¦¨à¦¾à¦Ÿà§‹à¦°', 'à¦ªà¦¾à¦¬à¦¨à¦¾', 'à¦¸à¦¿à¦°à¦¾à¦œà¦—à¦žà§à¦œ', 'à¦®à¦¾à¦¨à¦¿à¦•à¦—à¦žà§à¦œ', 'à¦®à§à¦¨à§à¦¶à§€à¦—à¦žà§à¦œ', 'à¦¶à¦°à¦¿à¦¯à¦¼à¦¤à¦ªà§à¦°', 'à¦•à¦•à¦¸à¦¬à¦¾à¦œà¦¾à¦°', 'à¦Ÿà¦¾à¦™à§à¦—à¦¾à¦‡à¦²',
  'Dhaka', 'Chittagong', 'Rajshahi', 'Khulna', 'Barishal', 'Sylhet', 'Rangpur', 'Mymensingh',
  'Comilla', 'Narayanganj', 'Gazipur', 'Jamalpur', 'Noakhali', 'Feni'
];

const RANGPUR_WARDS = [
  { id: '1', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§ (à¦§à¦¾à¦ª, à¦•à§‡à¦°à¦¾à¦¨à§€à¦ªà¦¾à§œà¦¾)', areas: ['à¦§à¦¾à¦ª', 'à¦•à§‡à¦°à¦¾à¦¨à§€à¦ªà¦¾à§œà¦¾'] },
  { id: '2', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨ (à¦®à§à¦¨à§à¦¸à¦¿à¦ªà¦¾à§œà¦¾, à¦¸à§‡à¦¨à¦ªà¦¾à§œà¦¾)', areas: ['à¦®à§à¦¨à§à¦¸à¦¿à¦ªà¦¾à§œà¦¾', 'à¦¸à§‡à¦¨à¦ªà¦¾à§œà¦¾'] },
  { id: '3', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§© (à¦•à¦²à§‡à¦œ à¦°à§‹à¦¡, à¦§à¦¾à¦ª à¦°à§‹à¦¡)', areas: ['à¦•à¦²à§‡à¦œ à¦°à§‹à¦¡', 'à¦§à¦¾à¦ª à¦°à§‹à¦¡'] },
  { id: '4', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§ª (à¦²à¦¾à¦²à¦•à§à¦ à¦¿, à¦¸à§à¦Ÿà§‡à¦¶à¦¨ à¦°à§‹à¦¡)', areas: ['à¦²à¦¾à¦²à¦•à§à¦ à¦¿', 'à¦¸à§à¦Ÿà§‡à¦¶à¦¨ à¦°à§‹à¦¡'] },
  { id: '5', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§« (à¦®à§‡à¦¡à¦¿à¦•à§‡à¦² à¦®à§‹à§œ, à¦¸à§‡à¦¨à§à¦Ÿà§à¦°à¦¾à¦² à¦°à§‹à¦¡)', areas: ['à¦®à§‡à¦¡à¦¿à¦•à§‡à¦² à¦®à§‹à§œ', 'à¦¸à§‡à¦¨à§à¦Ÿà§à¦°à¦¾à¦² à¦°à§‹à¦¡'] },
  { id: '6', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¬ (à¦²à¦¾à¦²à¦¬à¦¾à¦—, à¦¨à¦¿à¦‰ à¦²à¦¾à¦²à¦¬à¦¾à¦—)', areas: ['à¦²à¦¾à¦²à¦¬à¦¾à¦—', 'à¦¨à¦¿à¦‰ à¦²à¦¾à¦²à¦¬à¦¾à¦—'] },
  { id: '7', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§­ (à¦®à¦¾à¦¹à¦¿à¦—à¦žà§à¦œ à¦°à§‹à¦¡, à¦²à¦¾à¦²à¦¬à¦¾à¦— à¦¬à¦¾à¦œà¦¾à¦°)', areas: ['à¦®à¦¾à¦¹à¦¿à¦—à¦žà§à¦œ à¦°à§‹à¦¡', 'à¦²à¦¾à¦²à¦¬à¦¾à¦— à¦¬à¦¾à¦œà¦¾à¦°'] },
  { id: '8', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§® (à¦†à¦²à¦®à¦¨à¦—à¦° à¦†à¦‚à¦¶à¦¿à¦•)', areas: ['à¦†à¦²à¦®à¦¨à¦—à¦°'] },
  { id: '9', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¯ (à¦®à¦¾à¦¸à§à¦Ÿà¦¾à¦°à¦ªà¦¾à§œà¦¾, à¦–à¦²à¦¿à¦«à¦¾à¦ªà¦¾à§œà¦¾)', areas: ['à¦®à¦¾à¦¸à§à¦Ÿà¦¾à¦°à¦ªà¦¾à§œà¦¾', 'à¦–à¦²à¦¿à¦«à¦¾à¦ªà¦¾à§œà¦¾'] },
  { id: '10', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§¦ (à¦ªà¦¾à§Ÿà¦°à¦¾à¦šà¦¤à§à¦¬à¦°)', areas: ['à¦ªà¦¾à§Ÿà¦°à¦¾à¦šà¦¤à§à¦¬à¦°'] },
  { id: '11', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§§ (à¦°à¦¾à¦œà¦¾à¦°à¦¹à¦¾à¦Ÿ)', areas: ['à¦°à¦¾à¦œà¦¾à¦°à¦¹à¦¾à¦Ÿ'] },
  { id: '12', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§¨ (à¦¶à¦¾à¦²à¦¬à¦¨)', areas: ['à¦¶à¦¾à¦²à¦¬à¦¨'] },
  { id: '13', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§© (à¦•à§à¦ à¦¿à¦¬à¦¾à§œà¦¿)', areas: ['à¦•à§à¦ à¦¿à¦¬à¦¾à§œà¦¿'] },
  { id: '14', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§ª (à¦®à¦¡à¦¾à¦°à§à¦¨ à¦®à§‹à§œ)', areas: ['à¦®à¦¡à¦¾à¦°à§à¦¨ à¦®à§‹à§œ'] },
  { id: '15', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§« (à¦†à¦¬à¦¾à¦¸à¦¿à¦• à¦à¦²à¦¾à¦•à¦¾)', areas: ['à¦†à¦¬à¦¾à¦¸à¦¿à¦• à¦à¦²à¦¾à¦•à¦¾'] },
  { id: '16', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§¬ (à¦†à¦²à¦®à¦¨à¦—à¦°)', areas: ['à¦†à¦²à¦®à¦¨à¦—à¦°'] },
  { id: '17', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§­ (à¦œà§à¦®à§à¦®à¦¾à¦ªà¦¾à§œà¦¾)', areas: ['à¦œà§à¦®à§à¦®à¦¾à¦ªà¦¾à§œà¦¾'] },
  { id: '18', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§® (à¦‡à¦¸à¦²à¦¾à¦®à¦¬à¦¾à¦—)', areas: ['à¦‡à¦¸à¦²à¦¾à¦®à¦¬à¦¾à¦—'] },
  { id: '19', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§§à§¯ (à¦®à¦¡à§‡à¦² à¦•à¦²à§‹à¦¨à¦¿)', areas: ['à¦®à¦¡à§‡à¦² à¦•à¦²à§‹à¦¨à¦¿'] },
  { id: '20', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§¦ (à¦¸à§à¦¯à¦¾à¦Ÿà§‡à¦²à¦¾à¦‡à¦Ÿ à¦Ÿà¦¾à¦‰à¦¨)', areas: ['à¦¸à§à¦¯à¦¾à¦Ÿà§‡à¦²à¦¾à¦‡à¦Ÿ à¦Ÿà¦¾à¦‰à¦¨'] },
  { id: '21', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§§ (à¦¸à§à¦¯à¦¾à¦Ÿà§‡à¦²à¦¾à¦‡à¦Ÿ à¦à¦•à§à¦¸à¦Ÿà§‡à¦¨à¦¶à¦¨)', areas: ['à¦¸à§à¦¯à¦¾à¦Ÿà§‡à¦²à¦¾à¦‡à¦Ÿ à¦à¦•à§à¦¸à¦Ÿà§‡à¦¨à¦¶à¦¨'] },
  { id: '22', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§¨ (à¦‡à¦žà§à¦œà¦¿à¦¨à¦¿à§Ÿà¦¾à¦°à¦¿à¦‚ à¦•à¦²à§‡à¦œ)', areas: ['à¦‡à¦žà§à¦œà¦¿à¦¨à¦¿à§Ÿà¦¾à¦°à¦¿à¦‚ à¦•à¦²à§‡à¦œ'] },
  { id: '23', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§© (à¦®à§‡à¦¡à¦¿à¦•à§‡à¦² à¦•à¦²à§‡à¦œ)', areas: ['à¦®à§‡à¦¡à¦¿à¦•à§‡à¦² à¦•à¦²à§‡à¦œ'] },
  { id: '24', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§ª (à¦šà§Œà¦§à§à¦°à§€à¦ªà¦¾à§œà¦¾)', areas: ['à¦šà§Œà¦§à§à¦°à§€à¦ªà¦¾à§œà¦¾'] },
  { id: '25', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§« (à¦¤à¦¾à¦œà¦¹à¦¾à¦Ÿ)', areas: ['à¦¤à¦¾à¦œà¦¹à¦¾à¦Ÿ'] },
  { id: '26', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§¬ (à¦¹à¦°à¦¿à¦¦à§‡à¦¬à¦ªà§à¦°)', areas: ['à¦¹à¦°à¦¿à¦¦à§‡à¦¬à¦ªà§à¦°'] },
  { id: '27', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§­ (à¦¬à¦¾à¦¹à¦¿à¦°à§‡à¦° à¦†à¦¬à¦¾à¦¸à¦¿à¦•)', areas: ['à¦¬à¦¾à¦¹à¦¿à¦°à§‡à¦° à¦†à¦¬à¦¾à¦¸à¦¿à¦•'] },
  { id: '28', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§® (à¦¨à¦¤à§à¦¨ à¦•à¦²à§‹à¦¨à¦¿)', areas: ['à¦¨à¦¤à§à¦¨ à¦•à¦²à§‹à¦¨à¦¿'] },
  { id: '29', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§¨à§¯ (à¦—à§à¦°à§‹à¦¥ à¦à¦°à¦¿à§Ÿà¦¾)', areas: ['à¦—à§à¦°à§‹à¦¥ à¦à¦°à¦¿à§Ÿà¦¾'] },
  { id: '30', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§©à§¦ (à¦†à¦‰à¦Ÿà¦¾à¦° à¦°à¦¿à¦‚)', areas: ['à¦†à¦‰à¦Ÿà¦¾à¦° à¦°à¦¿à¦‚'] },
  { id: '31', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§©à§§ (à¦ªà¦²à§à¦²à§€ à¦à¦²à¦¾à¦•à¦¾)', areas: ['à¦ªà¦²à§à¦²à§€ à¦à¦²à¦¾à¦•à¦¾'] },
  { id: '32', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§©à§¨ (à¦¶à¦¹à¦°à¦¤à¦²à§€ à¦à¦²à¦¾à¦•à¦¾)', areas: ['à¦¶à¦¹à¦°à¦¤à¦²à§€ à¦à¦²à¦¾à¦•à¦¾'] },
  { id: '33', name: 'à¦“à§Ÿà¦¾à¦°à§à¦¡ à§©à§© (à¦à¦•à§à¦¸à¦Ÿà§‡à¦¨à§à¦¡à§‡à¦¡ à¦¸à¦¿à¦Ÿà¦¿)', areas: ['à¦à¦•à§à¦¸à¦Ÿà§‡à¦¨à§à¦¡à§‡à¦¡ à¦¸à¦¿à¦Ÿà¦¿'] }
];

const getCityWards = (district) => {
  if (district === 'à¦°à¦‚à¦ªà§à¦°' || district === 'Rangpur') return RANGPUR_WARDS;
  
  const cityWardsCount = {
    'à¦¢à¦¾à¦•à¦¾': 129, 'Dhaka': 129,
    'à¦šà¦Ÿà§à¦Ÿà¦—à§à¦°à¦¾à¦®': 41, 'Chittagong': 41,
    'à¦°à¦¾à¦œà¦¶à¦¾à¦¹à§€': 30, 'Rajshahi': 30,
    'à¦–à§à¦²à¦¨à¦¾': 31, 'Khulna': 31,
    'à¦¬à¦°à¦¿à¦¶à¦¾à¦²': 30, 'Barishal': 30,
    'à¦¸à¦¿à¦²à§‡à¦Ÿ': 42, 'Sylhet': 42,
    'à¦®à§Ÿà¦®à¦¨à¦¸à¦¿à¦‚à¦¹': 33, 'Mymensingh': 33,
    'à¦•à§à¦®à¦¿à¦²à§à¦²à¦¾': 27, 'Comilla': 27,
    'à¦¨à¦¾à¦°à¦¾à§Ÿà¦£à¦—à¦žà§à¦œ': 27, 'Narayanganj': 27,
    'à¦—à¦¾à¦œà§€à¦ªà§à¦°': 57, 'Gazipur': 57
  };
  
  const count = cityWardsCount[district] || 0;
  if (count === 0) return null;
  
  const wards = [];
  for (let i = 1; i <= count; i++) {
    wards.push({ id: `ward_${i}`, name: `à¦“à§Ÿà¦¾à¦°à§à¦¡ ${i}` });
  }
  return wards;
};

export default function SettingsPage() {
  const { user, userData, activeShopId } = useAuth();
  const [shop, setShop] = useState({ shopName: '', slogan: '', notices: '', welcomeMessage: '', subdomainSlug: '', banners: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);
  const [slugInput, setSlugInput] = useState('');
  const [slugEditing, setSlugEditing] = useState(false);
  const [slugError, setSlugError] = useState('');
  
  const [staffEmails, setStaffEmails] = useState([]);
  const [newStaffEmail, setNewStaffEmail] = useState('');
  
  const [customDomainInput, setCustomDomainInput] = useState('');
  const [customDomainEditing, setCustomDomainEditing] = useState(false);
  const [domainStatus, setDomainStatus] = useState(''); // '', 'pending_dns', 'connected', 'pending_manual'

  // Complex substates to prevent null referencing
  const [socialLinks, setSocialLinks] = useState({ fb: '', insta: '', yt: '', wa: '' });
  const [authSettings, setAuthSettings] = useState({ emailAuth: false, actionPin: '' });
  const [promoSettings, setPromoSettings] = useState({ seventhDayFree: false });
  const [deliveryConfig, setDeliveryConfig] = useState({ advanceFee: '', methods: '', isCOD: true });
  const [aiConfig, setAiConfig] = useState({ apiKey: '', botName: '', botTone: 'funny' });
  const [serviceAreas, setServiceAreas] = useState([]);
  const [newServiceArea, setNewServiceArea] = useState('');
  const [isStrictLocation, setIsStrictLocation] = useState(false);
  const [showLocationSelector, setShowLocationSelector] = useState(true);
  const [customAreas, setCustomAreas] = useState([]);
  const [newCustomArea, setNewCustomArea] = useState('');
  const [trackingConfig, setTrackingConfig] = useState({ ga4Id: '', clarityId: '' });
  
  const [geoData, setGeoData] = useState({ divisions: [], districts: [], upazilas: [], unions: [], unionsType: 'unions' });
  const [geoSelections, setGeoSelections] = useState({ division: '', district: '', upazila: '', upazilaName: '', union: '' });
  const [geoLoading, setGeoLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    getShop(user.uid).then(data => {
      if (data) {
        setShop({
          shopName: data.shopName || '',
          slogan: data.slogan || '',
          notices: data.notices || '',
          welcomeMessage: data.welcomeMessage || '',
          subdomainSlug: data.subdomainSlug || '',
          banners: data.banners || [],
          ...data
        });
      }
      setLogoPreview(data?.logoUrl || null);
      setSlugInput(data?.subdomainSlug || '');
      setCustomDomainInput(data?.customDomain || '');
      
      setSocialLinks({
        fb: data?.socialLinks?.fb || '', 
        insta: data?.socialLinks?.insta || '', 
        yt: data?.socialLinks?.yt || '',
        wa: data?.socialLinks?.wa || ''
      });
      setAuthSettings({
        emailAuth: data?.authSettings?.emailAuth || false, 
        actionPin: data?.authSettings?.actionPin || ''
      });
      setPromoSettings({
        seventhDayFree: data?.promoSettings?.seventhDayFree || false
      });
      setDeliveryConfig({ 
        advanceFee: data?.deliveryConfig?.advanceFee || '', 
        methods: data?.deliveryConfig?.methods || '', 
        isCOD: data?.deliveryConfig?.isCOD ?? true,
        contactEmail: data?.deliveryConfig?.contactEmail || '',
        contactWhatsapp: data?.deliveryConfig?.contactWhatsapp || ''
      });
      setAiConfig({ 
        apiKey: data?.aiConfig?.apiKey || '', 
        botName: data?.aiConfig?.botName || 'à¦¬à¦œà¦¾à¦° à¦à¦†à¦‡', 
        botTone: data?.aiConfig?.botTone || 'funny' 
      });
      setStaffEmails(data?.staffEmails || []);
      setServiceAreas(data?.serviceAreas || []);
      setIsStrictLocation(data?.isStrictLocation || false);
      setShowLocationSelector(data?.showLocationSelector !== false);
      setCustomAreas(data?.customAreas || []);
      setTrackingConfig({
        ga4Id: data?.trackingConfig?.ga4Id || '',
        clarityId: data?.trackingConfig?.clarityId || ''
      });
      setDomainStatus(data?.domainStatus || '');
      
      setLoading(false);
    });
  }, [user]);

  // â”€â”€ Geo: load divisions once â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    fetch('/api/geo?type=divisions').then(r => r.json()).then(data => {
      setGeoData(prev => ({ ...prev, divisions: Array.isArray(data) ? data : [] }));
    });
  }, []);

  // â”€â”€ Geo: load districts when division changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!geoSelections.division) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=districts&division_id=${geoSelections.division}`)
      .then(r => r.json()).then(data => {
        setGeoData(prev => ({ ...prev, districts: Array.isArray(data) ? data : [], upazilas: [], unions: [], unionsType: 'unions' }));
        setGeoSelections(prev => ({ ...prev, district: '', upazila: '', upazilaName: '', union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.division]);

  // â”€â”€ Geo: load upazilas when district changes â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!geoSelections.district) return;
    setGeoLoading(true);
    fetch(`/api/geo?type=upazilas&district_id=${geoSelections.district}`)
      .then(r => r.json()).then(data => {
        setGeoData(prev => ({ ...prev, upazilas: Array.isArray(data) ? data : [], unions: [], unionsType: 'unions' }));
        setGeoSelections(prev => ({ ...prev, upazila: '', upazilaName: '', union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.district]);

  // â”€â”€ Geo: load unions OR wards based on upazila type â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  useEffect(() => {
    if (!geoSelections.upazila) return;
    setGeoLoading(true);
    const params = new URLSearchParams({
      type: 'unions',
      upazila_id: geoSelections.upazila,
      upazila_name: geoSelections.upazilaName || '',
    });
    fetch(`/api/geo?${params.toString()}`)
      .then(r => r.json())
      .then(res => {
        // New API returns { data: [...], type: 'wards'|'unions' }
        const items = Array.isArray(res) ? res : (res.data || []);
        const resType = res.type || 'unions';
        setGeoData(prev => ({ ...prev, unions: items, unionsType: resType }));
        setGeoSelections(prev => ({ ...prev, union: '' }));
        setGeoLoading(false);
      });
  }, [geoSelections.upazila]);

  const addGeoArea = () => {
    const { division, district, upazila, upazilaName, union } = geoSelections;
    if (!division) return;
    
    const divName = geoData.divisions.find(d => d.id === division)?.bn_name;
    const distName = geoData.districts.find(d => d.id === district)?.bn_name;
    const upaName = upazilaName || geoData.upazilas.find(d => d.id === upazila)?.bn_name;
    const uniItem = geoData.unions.find(d => d.id === union);
    const uniName = uniItem?.bn_name || uniItem?.name;
    
    const parts = [divName, distName, upaName, uniName].filter(Boolean);
    const areaString = parts.join(' > ');
    
    if (areaString && !serviceAreas.includes(areaString)) {
      setServiceAreas([...serviceAreas, areaString]);
    }
  };


  // Protect page from staff users just in case they land here
  if (userData?.role === 'staff') {
     return <div className="p-20 text-center font-black text-slate-400">Settings restricted to Store Owner.</div>;
  }

  const handleLogoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const validateSlug = (val) => {
    if (!val) return 'URL cannot be empty';
    if (!/^[a-z0-9-]+$/.test(val)) return 'Only lowercase letters, numbers, and hyphens allowed';
    if (val.length < 3) return 'Minimum 3 characters';
    return '';
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦¸à¦¾à¦‡à¦œ à§« à¦®à§‡à¦—à¦¾à¦¬à¦¾à¦‡à¦Ÿà§‡à¦° à¦¬à§‡à¦¶à¦¿ à¦¹à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¬à§‡ à¦¨à¦¾à¥¤');
      return;
    }
    if ((shop.banners?.length || 0) >= 5) {
      toast.error('à¦†à¦ªà¦¨à¦¿ à¦¸à¦°à§à¦¬à§‹à¦šà§à¦š à§«à¦Ÿà¦¿ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦†à¦ªà¦²à§‹à¦¡ à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡à¦¨à¥¤');
      return;
    }
    
    const { uploadImage } = await import('@/lib/storage');
    setSaving(true);
    try {
      const url = await uploadImage(file);
      const newBanners = [...(shop.banners || []), url];
      await updateShop(user.uid, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦†à¦ªà¦²à§‹à¦¡ à¦¸à¦«à¦² à¦¹à¦¯à¦¼à§‡à¦›à§‡! ðŸ–¼ï¸');
    } catch (err) {
      toast.error(err.message || 'à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦†à¦ªà¦²à§‹à¦¡ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à¦¯à¦¼à§‡à¦›à§‡');
    } finally {
      setSaving(false);
    }
  };

  // TASK 5: Replace an existing banner at a specific index
  const replaceBanner = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦¸à¦¾à¦‡à¦œ à§« à¦®à§‡à¦—à¦¾à¦¬à¦¾à¦‡à¦Ÿà§‡à¦° à¦¬à§‡à¦¶à¦¿ à¦¹à¦“à¦¯à¦¼à¦¾ à¦¯à¦¾à¦¬à§‡ à¦¨à¦¾à¥¤');
      return;
    }
    const { uploadImage } = await import('@/lib/storage');
    setSaving(true);
    try {
      const url = await uploadImage(file);
      const newBanners = [...(shop.banners || [])];
      newBanners[index] = url;
      await updateShop(user.uid, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨ à¦¸à¦«à¦² à¦¹à¦¯à¦¼à§‡à¦›à§‡! ðŸ”„');
    } catch (err) {
      toast.error(err.message || 'à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦†à¦ªà¦²à§‹à¦¡ à¦¬à§à¦¯à¦°à§à¦¥ à¦¹à¦¯à¦¼à§‡à¦›à§‡');
    } finally {
      setSaving(false);
    }
  };

  const removeBanner = async (index) => {
    const newBanners = shop.banners.filter((_, i) => i !== index);
    setSaving(true);
    try {
      await updateShop(user.uid, { banners: newBanners });
      setShop(s => ({ ...s, banners: newBanners }));
      toast.success('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦¸à¦°à¦¾à¦¨à§‹ à¦¹à¦¯à¦¼à§‡à¦›à§‡');
    } catch (err) {
      toast.error('à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦° à¦¸à¦°à¦¾à¦¤à§‡ à¦¸à¦®à¦¸à§à¦¯à¦¾ à¦¹à¦¯à¦¼à§‡à¦›à§‡');
    } finally {
      setSaving(false);
    }
  };

  const handleSlugSave = async () => {
    const err = validateSlug(slugInput);
    if (err) { setSlugError(err); return; }
    setSlugError('');
    setSaving(true);
    try {
      await updateShop(user.uid, { subdomainSlug: slugInput, shopSlug: slugInput });
      setShop(s => ({ ...s, subdomainSlug: slugInput, shopSlug: slugInput }));
      toast.success('Store URL updated! ðŸ”—');
      setSlugEditing(false);
    } catch (err) {
      toast.error('Failed to update URL');
    } finally {
      setSaving(false);
    }
  };

  const handleCustomDomainSave = async () => {
    const rawInput = customDomainInput.trim();
    if (!rawInput) { toast.error('Custom domain cannot be empty.'); return; }
    const cleanDomain = rawInput.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
    // Basic format check
    if (!/^(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z]{2,})+$/.test(cleanDomain)) {
      toast.error('Invalid domain. Example: rahimshop.com');
      return;
    }
    setSaving(true);
    try {
      const vercelRes = await fetch('/api/domain', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ domain: cleanDomain, shopId: user.uid })
      });
      const vercelData = await vercelRes.json();

      if (!vercelRes.ok) {
        // 409 = duplicate domain
        toast.error(vercelData.error || 'Could not register domain.');
        setSaving(false);
        return;
      }

      const newStatus = vercelData.status || 'pending_dns';
      await updateShop(user.uid, { customDomain: cleanDomain, domainStatus: newStatus });
      setShop(s => ({ ...s, customDomain: cleanDomain, domainStatus: newStatus }));
      setDomainStatus(newStatus);
      setCustomDomainEditing(false);

      if (newStatus === 'pending_manual') {
        toast('Domain saved. Add the domain manually in Vercel dashboard.', { icon: 'âš ï¸' });
      } else {
        toast.success('Domain registered! Now configure DNS below.');
      }
    } catch (err) {
      toast.error('Failed to save custom domain.');
    } finally {
      setSaving(false);
    }
  };

  // Poll Vercel every 30s to see if custom domain DNS has been verified
  useEffect(() => {
    if (!shop?.customDomain || domainStatus === 'connected') return;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/domain?domain=${encodeURIComponent(shop.customDomain)}`);
        const data = await res.json();
        if (data.status === 'connected') {
          setDomainStatus('connected');
          await updateShop(user.uid, { domainStatus: 'connected' });
          setShop(s => ({ ...s, domainStatus: 'connected' }));
          toast.success(`âœ… ${shop.customDomain} is now live!`);
        }
      } catch (e) { /* silent */ }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 30000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shop?.customDomain, domainStatus]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user || !shop) return;
    setSaving(true);
    try {
      let logoUrl = shop.logoUrl || '';
      if (logoFile) {
        logoUrl = await uploadShopLogo(user.uid, logoFile);
      }
      
      await updateShop(user.uid, { 
        shopName: shop.shopName,
        slogan: shop.slogan,
        notices: shop.notices,
        welcomeMessage: shop.welcomeMessage,
        bannerInterval: shop.bannerInterval || 4,
        logoUrl,
        socialLinks,
        authSettings,
        promoSettings,
        deliveryConfig,
        aiConfig,
        staffEmails,
        serviceAreas,
        isStrictLocation,
        showLocationSelector,
        customAreas,
        trackingConfig
      });
      toast.success('All settings synchronized! âœ¨');
    } catch (err) {
      console.error(err);
      toast.error('Settings update failed');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="py-20 text-center">
        <div className="w-10 h-10 border-4 border-slate-100 border-t-purple-600 rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Loading configurations...</p>
      </div>
    );
  }

  const storeUrl = `${typeof window !== 'undefined' ? window.location.origin : 'https://webmaa.cloud'}/shop/${shop?.subdomainSlug}`;

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-slide-in pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Store Customizer</h1>
          <p className="text-sm text-slate-500 font-medium">Configure deep integrations, auth, AI, and visuals.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Visual Identity & Left Col */}
        <div className="lg:col-span-4 space-y-8">
          <Card title="Store Public URL" subtitle="Your live shop link" icon={Link2} className="border-2 border-slate-100 shadow-xl bg-white">
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-inner relative">
                {slugEditing ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-1">
                      <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">/shop/</span>
                      <input
                        type="text"
                        value={slugInput}
                        onChange={e => { setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')); setSlugError(''); }}
                        className="flex-1 bg-white border-2 border-purple-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-purple-600 transition-all text-slate-900"
                      />
                    </div>
                    {slugError && <p className="text-[10px] text-red-500 font-bold">{slugError}</p>}
                    <div className="flex gap-2">
                       <button onClick={handleSlugSave} disabled={saving} className="flex-1 py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-purple-500/20 active:scale-95 transition-all">Save</button>
                       <button onClick={() => setSlugEditing(false)} className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 active:scale-95 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <a href={storeUrl} target="_blank" rel="noreferrer" className="text-sm font-black text-purple-600 hover:text-purple-700 underline truncate block tracking-tight">{storeUrl}</a>
                    <button onClick={() => setSlugEditing(true)} className="mt-3 w-full py-2.5 bg-purple-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-purple-700 shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2">
                       Set Custom Subdomain
                    </button>
                  </div>
                )}

              </div>
            </div>

            {/* Custom Domain Management UI */}
            <div>
              <p className="text-xs font-black text-slate-900 mb-1 flex items-center gap-2"><Globe size={14}/> Custom Domain Mapping (Pro)</p>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-2">Connect your own .com / .shop domain</p>
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 shadow-inner relative">
                {customDomainEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      placeholder="e.g. rahimshop.com"
                      value={customDomainInput}
                      onChange={e => setCustomDomainInput(e.target.value.toLowerCase())}
                      className="w-full bg-white border-2 border-emerald-200 rounded-xl px-3 py-2 text-sm font-black outline-none focus:border-emerald-600 transition-all text-slate-900"
                    />
                    <div className="flex gap-2">
                       <button onClick={handleCustomDomainSave} disabled={saving} className="flex-1 py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase shadow-lg shadow-emerald-500/20 active:scale-95 transition-all">Save Domain</button>
                       <button onClick={() => setCustomDomainEditing(false)} className="flex-1 py-2.5 bg-white text-slate-600 border border-slate-200 rounded-xl text-[10px] font-black uppercase hover:bg-slate-50 active:scale-95 transition-all">Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {shop?.customDomain ? (
                      <div className="space-y-3">
                        {/* Domain + Status Badge */}
                        <div className="flex items-center gap-2 flex-wrap">
                          <a href={`https://${shop.customDomain}`} target="_blank" rel="noreferrer" className="text-sm font-black text-emerald-700 hover:text-emerald-800 underline truncate tracking-tight">
                            {shop.customDomain}
                          </a>
                          {/* Status Badge */}
                          {domainStatus === 'connected' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Connected
                            </span>
                          )}
                          {(domainStatus === 'pending_dns' || domainStatus === '') && shop?.customDomain && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span> Pending DNS
                            </span>
                          )}
                          {domainStatus === 'pending_manual' && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-[9px] font-black uppercase tracking-wider">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-400"></span> Manual Required
                            </span>
                          )}
                        </div>

                        {/* DNS Instructions â€” only show when not yet connected */}
                        {domainStatus !== 'connected' && (
                          <div className="p-3 bg-white rounded-xl border border-emerald-200 text-xs">
                            <p className="font-bold text-slate-800 mb-2">DNS Instructions (Add in your Domain Panel):</p>
                            <div className="space-y-2 font-mono text-[10px]">
                              <div className="flex justify-between bg-slate-50 p-2 rounded">
                                 <span className="text-slate-500 font-bold">Type: A</span>
                                 <span className="text-slate-500 font-bold">Name: @</span>
                                 <span className="text-emerald-700 font-black select-all">76.76.21.21</span>
                              </div>
                              <div className="flex justify-between bg-slate-50 p-2 rounded">
                                 <span className="text-slate-500 font-bold">Type: CNAME</span>
                                 <span className="text-slate-500 font-bold">Name: www</span>
                                 <span className="text-emerald-700 font-black select-all">cname.vercel-dns.com</span>
                              </div>
                            </div>
                            <p className="text-[9px] text-amber-600 font-bold mt-2">
                              â± DNS changes take 10â€“30 minutes. This page auto-checks every 30 seconds.
                            </p>
                          </div>
                        )}
                        {domainStatus === 'connected' && (
                          <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 text-[10px] font-bold text-emerald-700">
                            âœ… Your custom domain is live with SSL! Customers can now access your store via <span className="underline">{shop.customDomain}</span>.
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-xs font-bold text-slate-400">No custom domain linked. Connect your own .com or .shop domain below.</p>
                    )}
                    <button onClick={() => setCustomDomainEditing(true)} className="mt-1 w-full py-2.5 bg-emerald-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-emerald-700 shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2">
                       {shop?.customDomain ? 'Change Domain' : 'Connect Custom Domain'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </Card>

          <Card title="Brand Assets" subtitle="Visual Logo" icon={ImageIcon} className="shadow-sm">
            <div className="flex flex-col items-center">
              <div className="relative group w-32 h-32 mb-4">
                <div className="w-full h-full rounded-3xl overflow-hidden bg-slate-50 border border-slate-100 flex items-center justify-center p-3">
                  {logoPreview ? <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" /> : <Store size={40} className="text-slate-200"/>}
                </div>
                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center cursor-pointer rounded-3xl border-2 border-white border-dashed">
                  <span className="text-[10px] text-white font-black uppercase">Upload</span>
                  <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                </label>
              </div>
            </div>
          </Card>
          
          <Card title="Loyalty & Promo" subtitle="Customer Retention" icon={Gift} className="border-l-4 border-l-emerald-400">
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                   <p className="text-xs font-black text-slate-900">7th Day Special Hero</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">6 days streak = Free Delivery</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={promoSettings.seventhDayFree} onChange={e => setPromoSettings({...promoSettings, seventhDayFree: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
             </div>
          </Card>

          <Card title="Customer Auth" subtitle="Sign-in Options" icon={Users}>
             <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                <div>
                   <p className="text-xs font-black text-slate-900">Email & Password Auth</p>
                   <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Allow custom registration</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={authSettings.emailAuth} onChange={e => setAuthSettings({...authSettings, emailAuth: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
             </div>
          </Card>
        </div>

        {/* Configurations Col */}
        <div className="lg:col-span-8 space-y-8">
          
          <form onSubmit={handleSave} className="space-y-8">
            <Card title="Staff Management" subtitle="Multi-Tenant Isolation" icon={Users} className="border-l-4 border-l-blue-500">
               <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    Add email addresses of users who can manage your inventory and orders. Staff will have a fully isolated dashboard.
                  </p>
                  
                  <div className="flex gap-2">
                     <Input 
                       placeholder="staff@gmail.com" 
                       type="email"
                       value={newStaffEmail}
                       onChange={e => setNewStaffEmail(e.target.value)}
                       className="flex-1"
                     />
                     <Button type="button" onClick={() => {
                        if (newStaffEmail && !staffEmails.includes(newStaffEmail.toLowerCase())) {
                           setStaffEmails([...staffEmails, newStaffEmail.toLowerCase()]);
                           setNewStaffEmail('');
                        }
                     }} className="h-[52px]">Add Staff</Button>
                  </div>
                  
                  {staffEmails.length > 0 && (
                     <div className="bg-slate-50 border border-slate-200 rounded-xl divide-y divide-slate-100">
                        {staffEmails.map(email => (
                           <div key={email} className="flex justify-between items-center p-3 px-4 text-sm font-bold text-slate-800">
                              {email}
                              <button type="button" onClick={() => setStaffEmails(staffEmails.filter(e => e !== email))} className="text-[10px] text-red-500 hover:bg-red-50 px-2 py-1 rounded">Remove</button>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            </Card>
            
            <Card title="Security Preferences" subtitle="Action Authorization" icon={ShieldCheck}>
               <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <div className="max-w-[70%]">
                     <p className="text-xs font-black text-slate-900">4-Digit Security PIN</p>
                     <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">Requires PIN when changing order status</p>
                  </div>
                  <Input 
                     type="password"
                     maxLength={4}
                     placeholder="****"
                     className="w-24 text-center font-black tracking-widest text-lg"
                     value={authSettings.actionPin}
                     onChange={e => setAuthSettings({...authSettings, actionPin: e.target.value.replace(/\D/g, '').slice(0, 4)})}
                  />
               </div>
            </Card>

            <Card title="Checkout & Delivery" subtitle="Payments & COD" icon={Truck}>
              <div className="flex items-center justify-between bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
                 <div>
                    <p className="text-xs font-black text-slate-900">Cash on Delivery (COD)</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase mt-1">If off, full payment is required via TxnID</p>
                 </div>
                 <label className="relative inline-flex items-center cursor-pointer">
                   <input type="checkbox" className="sr-only peer" checked={deliveryConfig.isCOD} onChange={e => setDeliveryConfig({...deliveryConfig, isCOD: e.target.checked})} />
                   <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                 </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 border-t border-slate-100 pt-6">
                 <Input
                   label={deliveryConfig.isCOD ? "Advance Delivery Fee (à§³)" : "Flat Delivery Fee (à§³)"}
                   type="number"
                   value={deliveryConfig.advanceFee}
                   onChange={e => setDeliveryConfig({...deliveryConfig, advanceFee: e.target.value})}
                   placeholder="e.g. 100"
                 />
                 <Input
                   label="Accepted Payment Numbers"
                   value={deliveryConfig.methods}
                   onChange={e => setDeliveryConfig({...deliveryConfig, methods: e.target.value})}
                   placeholder="bKash: 017.., Nagad.."
                 />
                 <Input
                   label="Default Delivery Time (e.g. 30 minutes, 1 day)"
                   value={deliveryConfig.defaultDeliveryTime || ''}
                   onChange={e => setDeliveryConfig({...deliveryConfig, defaultDeliveryTime: e.target.value})}
                   placeholder="e.g. 45 minutes"
                 />
              </div>
              <p className="text-[10px] text-slate-400 mt-4 leading-relaxed">
                 {deliveryConfig.isCOD 
                   ? "If advance fee is set, customers must provide a Transaction ID to clear the advance fee before ordering. The rest will be Cash on Delivery."
                   : "Cash on delivery is disabled. Customers must pay the Total Value + Delivery Fee entirely before placing the order."
                 }
              </p>
            </Card>

            <Card title="Store AI Companion" subtitle="Smart Assistant" icon={Sparkles} className="border-2 border-purple-100 bg-purple-50/10">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Input
                    label="LLM API Key (Gemini/OpenAI)"
                    type="password"
                    value={aiConfig.apiKey}
                    onChange={e => setAiConfig({...aiConfig, apiKey: e.target.value})}
                    placeholder="Enter your private API key"
                  />
                  <Input
                    label="AI Avatar Name"
                    value={aiConfig.botName}
                    onChange={e => setAiConfig({...aiConfig, botName: e.target.value})}
                    placeholder="e.g. Bazar Bot"
                  />
                  <div className="md:col-span-2 space-y-2">
                     <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">AI Conversation Tone</label>
                     <div className="flex gap-4">
                        <label className="flex-1 cursor-pointer">
                           <input type="radio" name="tone" value="funny" checked={aiConfig.botTone === 'funny'} onChange={e => setAiConfig({...aiConfig, botTone: e.target.value})} className="peer sr-only"/>
                           <div className="p-4 border-2 border-slate-100 rounded-2xl text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all">
                              <p className="font-black text-slate-900 text-sm">Funny & Witty ðŸŽ­</p>
                           </div>
                        </label>
                        <label className="flex-1 cursor-pointer">
                           <input type="radio" name="tone" value="formal" checked={aiConfig.botTone === 'formal'} onChange={e => setAiConfig({...aiConfig, botTone: e.target.value})} className="peer sr-only"/>
                           <div className="p-4 border-2 border-slate-100 rounded-2xl text-center peer-checked:border-purple-600 peer-checked:bg-purple-50 transition-all">
                              <p className="font-black text-slate-900 text-sm">Strictly Formal ðŸ‘”</p>
                           </div>
                        </label>
                     </div>
                  </div>
               </div>
            </Card>

            <Card title="Display & Branding" subtitle="Marquee and text" icon={Text}>
              <div className="space-y-6">
                <Input
                  label="Display Name"
                  value={shop.shopName || ''}
                  onChange={e => setShop({ ...shop, shopName: e.target.value })}
                />
                <Input
                  label="Slogan"
                  value={shop.slogan || ''}
                  onChange={e => setShop({ ...shop, slogan: e.target.value })}
                  placeholder="Your catchy brand slogan"
                />
                <Input
                  label="Store Notice (Marquee)"
                  value={shop.notices || ''}
                  onChange={e => setShop({ ...shop, notices: e.target.value })}
                  placeholder="Top scrolling notice (e.g. Eid Discount!!!)"
                />
                <Input
                  label="Welcome Heading"
                  value={shop.welcomeMessage || ''}
                  onChange={e => setShop({ ...shop, welcomeMessage: e.target.value })}
                  placeholder="Welcome message if no banner is set"
                />

                <div className="space-y-3 pt-4 border-t border-slate-100">
                   <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Shop Banners (Max 5, 5MB each)</label>
                   <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {shop.banners?.map((url, i) => (
                         <div key={i} className="relative aspect-video rounded-xl overflow-hidden border border-slate-200 group">
                            <img src={url} className="w-full h-full object-cover" alt={`Banner ${i+1}`} />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
                              {/* Replace Banner */}
                              <label className="bg-white text-slate-800 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase cursor-pointer hover:bg-purple-100 transition-colors shadow-lg">
                                ðŸ”„ à¦ªà¦°à¦¿à¦¬à¦°à§à¦¤à¦¨
                                <input type="file" accept="image/*" className="hidden" onChange={(e) => replaceBanner(e, i)} />
                              </label>
                              {/* Delete Banner */}
                              <button 
                                type="button" 
                                onClick={() => removeBanner(i)}
                                className="bg-red-600 text-white px-3 py-1.5 rounded-lg text-[10px] font-black uppercase hover:bg-red-700 transition-colors shadow-lg"
                              >
                                âœ• à¦®à§à¦›à§à¦¨
                              </button>
                            </div>
                            <span className="absolute top-2 left-2 bg-black/60 text-white text-[9px] font-black px-2 py-0.5 rounded-md">{i+1}/{shop.banners.length}</span>
                         </div>
                      ))}
                      {(shop.banners?.length || 0) < 5 && (
                         <label className="aspect-video rounded-xl border-2 border-dashed border-slate-200 flex flex-col items-center justify-center gap-2 hover:bg-purple-50 hover:border-purple-300 cursor-pointer transition-colors group">
                            <ImageIcon size={24} className="text-slate-300 group-hover:text-purple-500 transition-colors" />
                            <span className="text-[10px] font-black text-slate-400 group-hover:text-purple-600">+ à¦¨à¦¤à§à¦¨ à¦¬à§à¦¯à¦¾à¦¨à¦¾à¦°</span>
                            <input type="file" accept="image/*" className="hidden" onChange={handleBannerUpload} />
                         </label>
                      )}
                   </div>
                   {/* Banner Auto-slide Interval */}
                   <div className="flex items-center gap-4 bg-slate-50 border border-slate-100 rounded-xl p-4 mt-3">
                     <Clock size={18} className="text-purple-500 shrink-0" />
                     <div className="flex-1">
                       <p className="text-xs font-black text-slate-900">Auto-slide Interval</p>
                       <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5">Seconds per banner (default: 4s)</p>
                     </div>
                     <input
                       type="number" min="1" max="60"
                       value={shop.bannerInterval || 4}
                       onChange={e => setShop({ ...shop, bannerInterval: parseInt(e.target.value) || 4 })}
                       className="w-20 text-center font-black text-lg bg-white border-2 border-slate-200 rounded-xl py-2 outline-none focus:border-purple-600 text-slate-900"
                     />
                   </div>
                </div>
              </div>
            </Card>

            {/* Service Area Location */}
            <Card title="à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦à¦²à¦¾à¦•à¦¾" subtitle="à¦•à§‹à¦¥à¦¾à¦¯à¦¼ à¦¡à§‡à¦²à¦¿à¦­à¦¾à¦°à¦¿ à¦•à¦°à§‡à¦¨ à¦¤à¦¾ à¦¸à§‡à¦Ÿ à¦•à¦°à§à¦¨" icon={MapPin} className="border-l-4 border-l-emerald-500">
              <div className="space-y-6">
                <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
                  <div>
                    <h4 className="text-sm font-black text-emerald-900 flex items-center gap-2">
                       <ShieldCheck size={16} className="text-emerald-600" /> à¦¸à§à¦Ÿà§à¦°à¦¿à¦•à§à¦Ÿ à¦²à§‹à¦•à§‡à¦¶à¦¨ à¦®à§à¦¯à¦¾à¦š (Strict Match)
                    </h4>
                    <p className="text-[10px] font-bold text-emerald-600 uppercase mt-1">à¦²à§‹à¦•à§‡à¦¶à¦¨à§‡à¦° à¦¬à¦¾à¦‡à¦°à§‡ à¦•à§‡à¦‰ à¦…à¦°à§à¦¡à¦¾à¦° à¦•à¦°à¦¤à§‡ à¦ªà¦¾à¦°à¦¬à§‡ à¦¨à¦¾</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={isStrictLocation} onChange={e => setIsStrictLocation(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <div>
                    <h4 className="text-sm font-black text-blue-900 flex items-center gap-2">
                       <MapPin size={16} className="text-blue-600" /> à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦°à¦•à§‡ à¦²à§‹à¦•à§‡à¦¶à¦¨ à¦¬à¦•à§à¦¸ à¦¦à§‡à¦–à¦¾à¦¬à§‡à¦¨?
                    </h4>
                    <p className="text-[10px] font-bold text-blue-600 uppercase mt-1">à¦…à¦« à¦¥à¦¾à¦•à¦²à§‡ à¦¶à§à¦§à§ GPS à¦¦à¦¿à§Ÿà§‡ à¦…à¦Ÿà§‹à¦®à§‡à¦Ÿà¦¿à¦• à¦šà§‡à¦• à¦¹à¦¬à§‡</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" className="sr-only peer" checked={showLocationSelector} onChange={e => setShowLocationSelector(e.target.checked)} />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-4">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">à¦•à¦¾à¦¸à§à¦Ÿà¦® à¦à¦²à¦¾à¦•à¦¾ à¦¯à§‹à¦— à¦•à¦°à§à¦¨</h4>
                    <p className="text-[10px] font-bold text-slate-500 mt-1 uppercase">à¦¯à§‡ à¦à¦²à¦¾à¦•à¦¾à¦° à¦¨à¦¾à¦® à¦…à¦Ÿà§‹à¦®à§‡à¦Ÿà¦¿à¦• à¦²à¦¿à¦¸à§à¦Ÿà§‡ à¦¨à§‡à¦‡ (à¦à¦šà§à¦›à¦¿à¦•)</p>
                  </div>
                  <div className="flex gap-2">
                    <Input 
                      placeholder="à¦¯à§‡à¦®à¦¨: à¦¨à¦¤à§à¦¨ à¦¬à¦¾à¦œà¦¾à¦°, à¦¬à§à¦²à¦• à¦¸à¦¿" 
                      value={newCustomArea}
                      onChange={e => setNewCustomArea(e.target.value)}
                      className="flex-1"
                    />
                    <Button type="button" onClick={() => {
                      if (newCustomArea.trim() && !customAreas.includes(newCustomArea.trim())) {
                         setCustomAreas([...customAreas, newCustomArea.trim()]);
                         setNewCustomArea('');
                      }
                    }} className="h-[52px]">à¦¯à§‹à¦— à¦•à¦°à§à¦¨</Button>
                  </div>
                  {customAreas.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {customAreas.map(area => (
                        <div key={area} className="flex items-center gap-2 bg-white border border-slate-300 text-slate-800 px-3 py-1.5 rounded-xl text-sm font-black">
                          {area}
                          <button type="button" onClick={() => setCustomAreas(customAreas.filter(a => a !== area))} className="text-slate-400 hover:text-red-500 transition-colors ml-1">
                            <X size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <p className="text-xs text-slate-500 font-bold leading-relaxed">
                    à¦¬à¦¾à¦‚à¦²à¦¾à¦¦à§‡à¦¶ à¦œà¦¿à¦“-à¦¡à§‡à¦Ÿà¦¾ à¦…à¦¨à§à¦¯à¦¾à§Ÿà§€ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦à¦²à¦¾à¦•à¦¾ à¦¬à§‡à¦›à§‡ à¦¨à¦¿à¦¨ (à¦¬à¦¿à¦­à¦¾à¦— {' > '} à¦œà§‡à¦²à¦¾ {' > '} à¦‰à¦ªà¦œà§‡à¦²à¦¾ {' > '} à¦‡à¦‰à¦¨à¦¿à§Ÿà¦¨/à¦¸à¦¿à¦Ÿà¦¿)à¥¤ à¦•à¦¾à¦¸à§à¦Ÿà¦®à¦¾à¦°à¦°à¦¾ à¦…à¦°à§à¦¡à¦¾à¦°à§‡à¦° à¦¸à¦®à§Ÿ à¦à¦‡ à¦à¦²à¦¾à¦•à¦¾à¦° à¦¸à¦¾à¦¥à§‡ à¦²à§‹à¦•à§‡à¦¶à¦¨ à¦®à§à¦¯à¦¾à¦šà¦¿à¦‚ à¦¹à¦¬à§‡à¥¤
                  </p>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* 1. Division */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">à¦¬à¦¿à¦­à¦¾à¦—</label>
                      <select
                        value={geoSelections.division}
                        onChange={e => setGeoSelections({ ...geoSelections, division: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer"
                      >
                        <option value="">-- à¦¬à¦¿à¦­à¦¾à¦— --</option>
                        {geoData.divisions.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 2. District */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">à¦œà§‡à¦²à¦¾</label>
                      <select
                        disabled={!geoSelections.division || !geoData.districts.length}
                        value={geoSelections.district}
                        onChange={e => setGeoSelections({ ...geoSelections, district: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">-- à¦œà§‡à¦²à¦¾ --</option>
                        {geoData.districts.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 3. Upazila */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">à¦‰à¦ªà¦œà§‡à¦²à¦¾</label>
                      <select
                        disabled={!geoSelections.district || !geoData.upazilas.length}
                        value={geoSelections.upazila}
                        onChange={e => {
                          const sel = geoData.upazilas.find(u => u.id === e.target.value);
                          setGeoSelections({ ...geoSelections, upazila: e.target.value, upazilaName: sel?.bn_name || '', union: '' });
                        }}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">-- à¦‰à¦ªà¦œà§‡à¦²à¦¾ --</option>
                        {geoData.upazilas.map(d => <option key={d.id} value={d.id}>{d.bn_name}</option>)}
                      </select>
                    </div>

                    {/* 4. Ward / Union â€” label changes based on type returned by API */}
                    <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block pl-1">
                        {geoData.unionsType === 'wards' ? 'à¦¸à¦¿à¦Ÿà¦¿ à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡' : 'à¦‡à¦‰à¦¨à¦¿à¦¯à¦¼à¦¨'}
                      </label>
                      <select
                        disabled={!geoSelections.upazila || geoLoading}
                        value={geoSelections.union}
                        onChange={e => setGeoSelections({ ...geoSelections, union: e.target.value })}
                        className="w-full bg-white border-2 border-slate-200 rounded-xl px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-purple-500 appearance-none cursor-pointer disabled:bg-slate-50 disabled:opacity-60"
                      >
                        <option value="">{geoLoading ? 'à¦²à§‹à¦¡ à¦¹à¦šà§à¦›à§‡...' : `-- ${geoData.unionsType === 'wards' ? 'à¦“à¦¯à¦¼à¦¾à¦°à§à¦¡' : 'à¦‡à¦‰à¦¨à¦¿à¦¯à¦¼à¦¨'} (à¦à¦šà§à¦›à¦¿à¦•) --`}</option>
                        {geoData.unions.map(d => <option key={d.id} value={d.id}>{d.bn_name || d.name}</option>)}
                      </select>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={!geoSelections.division || geoLoading}
                    onClick={addGeoArea}
                    className="w-full py-3.5 bg-purple-600 text-white rounded-2xl font-black text-sm hover:bg-purple-700 active:scale-95 transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {geoLoading ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Plus size={16} />}
                    à¦à¦²à¦¾à¦•à¦¾ à¦¯à§‹à¦— à¦•à¦°à§à¦¨
                  </button>
                </div>


                {/* Selected areas */}
                {serviceAreas.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {serviceAreas.map(area => (
                      <div key={area} className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-sm font-black">
                        <MapPin size={12} className="text-emerald-600" />
                        {area}
                        <button type="button" onClick={() => setServiceAreas(serviceAreas.filter(a => a !== area))} className="text-emerald-600 hover:text-red-600 transition-colors ml-1">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {serviceAreas.length === 0 && (
                  <p className="text-center text-slate-400 text-xs font-bold py-4 border-2 border-dashed border-slate-100 rounded-xl">à¦•à§‹à¦¨à§‹ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦à¦²à¦¾à¦•à¦¾ à¦¸à§‡à¦Ÿ à¦•à¦°à¦¾ à¦¹à¦¯à¦¼à¦¨à¦¿à¥¤ à¦¸à¦¬ à¦œà¦¾à¦¯à¦¼à¦—à¦¾à¦¯à¦¼ à¦¸à¦¾à¦°à§à¦­à¦¿à¦¸ à¦¦à§‡à¦–à¦¾à¦¨à§‹ à¦¹à¦¬à§‡à¥¤</p>
                )}
              </div>
            </Card>

            <Card title="Social Ecosystem" subtitle="Connect Audiences" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                   <Input label="Facebook" placeholder="Facebook URL" value={socialLinks.fb} onChange={e => setSocialLinks({...socialLinks, fb: e.target.value})} />
                   <Input label="Instagram" placeholder="Instagram URL" value={socialLinks.insta} onChange={e => setSocialLinks({...socialLinks, insta: e.target.value})} />
                   <Input label="YouTube" placeholder="YouTube URL" value={socialLinks.yt} onChange={e => setSocialLinks({...socialLinks, yt: e.target.value})} />
                   <Input label="WhatsApp (Number)" placeholder="e.g. 01700000000" value={socialLinks.wa} onChange={e => setSocialLinks({...socialLinks, wa: e.target.value})} />
                </div>
             </Card>

            <Card title="User Tracking (Analytics)" subtitle="Track User Behavior" icon={Users} className="border-2 border-slate-100 shadow-xl bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                   <Input 
                     label="Google Analytics 4 (GA4) ID" 
                     placeholder="G-XXXXXXX" 
                     value={trackingConfig.ga4Id} 
                     onChange={e => setTrackingConfig({...trackingConfig, ga4Id: e.target.value})} 
                   />
                   <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                     Tracks product clicks, add to cart, and checkout funnel. Enter your GA4 measurement ID.
                   </p>
                </div>
                <div>
                   <Input 
                     label="Microsoft Clarity Project ID" 
                     placeholder="a1b2c3d4e5" 
                     value={trackingConfig.clarityId} 
                     onChange={e => setTrackingConfig({...trackingConfig, clarityId: e.target.value})} 
                   />
                   <p className="text-[10px] text-slate-400 mt-2 font-bold leading-relaxed">
                     Insanely powerful free tool. Provides session recordings and user heatmaps on your storefront.
                   </p>
                </div>
              </div>
            </Card>

            <Button
              variant="primary"
              loading={saving}
              icon={Save}
              className="w-full h-16 text-lg tracking-widest font-black uppercase shadow-xl shadow-purple-500/20"
              type="submit"
            >
              Commit Changes Over Network
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
