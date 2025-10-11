// OCRReadingScreen.tsx
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ActivityIndicator,
  Alert,
  Modal,
  Dimensions,
} from 'react-native';
import {RNCamera} from 'react-native-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import {useNavigation} from '@react-navigation/native';
import type {StackNavigationProp} from '@react-navigation/stack';
import type {OrderStackParamList} from '@/navigator/containers/Order';
import {orderStore} from '@/globalStore';
import Toast from 'react-native-toast-message';
import RNPickerSelect from 'react-native-picker-select';

interface FormData {
  dg_hours: string;
  eb_hours: string;
  battery_hours: string;
  technician_at_site: string;
  cumulative_ebrh: string;
  cumulative_bbrh: string;
  cumulative_dgrh: string;
  dg_status: string;
  dg_type: string;
  qrc: string;
  opening_stock: string;
  filled_quantity: string;
  dg_hmr: string;
  piu_hmr: string;
  tank_depth_before: string;
  tank_depth_after: string;
  location: string;
  coordinates: string;
  date_time: string;
}

const {width, height} = Dimensions.get('window');

const OCRReadingScreen: React.FC = () => {
  const navigation = useNavigation<StackNavigationProp<OrderStackParamList>>();
  const cameraRef = useRef<RNCamera>(null);

  const [formData, setFormData] = useState<FormData>({
    dg_hours: '',
    eb_hours: '',
    battery_hours: '',
    technician_at_site: '',
    cumulative_ebrh: '',
    cumulative_bbrh: '',
    cumulative_dgrh: '',
    dg_status: '',
    dg_type: '',
    qrc: '',
    opening_stock: '',
    filled_quantity: '',
    dg_hmr: '',
    piu_hmr: '',
    tank_depth_before: '',
    tank_depth_after: '',
    location: '',
    coordinates: '',
    date_time: '',
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [ocrCompleted, setOcrCompleted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [page1Captured, setPage1Captured] = useState(false);
  const [page2Captured, setPage2Captured] = useState(false);
  const [currentPage, setCurrentPage] = useState<1 | 2>(1);

  const openCamera = (page: 1 | 2) => {
    setCurrentPage(page);
    setShowCamera(true);
  };
  const closeCamera = () => setShowCamera(false);

  const takePicture = async () => {
    if (!cameraRef.current) return;
    try {
      const data = await cameraRef.current.takePictureAsync({quality: 0.8});
      closeCamera();
      processImage(data.uri, currentPage);
    } catch (err) {
      console.error('Camera Error:', err);
      Alert.alert('Error', 'Failed to take picture');
    }
  };

  // ---------- helpers ----------
  const norm = (s?: string | null) =>
    (s || '').toString().replace(/[:*]+/g, '').replace(/\|/g, '').trim();

  const isNumberLike = (t?: string) => {
    if (!t) return false;
    const clean = t.replace(/[^\d\.\-\,]/g, '').replace(/,+/g, '');
    return /^-?\d+(\.\d+)?$/.test(clean);
  };
  const cleanNumber = (t?: string) => {
    if (!t) return '';
    return t
      .replace(/[^\d\.\-]/g, '')
      .replace(/,+/g, '')
      .trim();
  };
  const isYesNo = (t?: string) => {
    if (!t) return false;
    return /^(yes|no|y|n)$/i.test(t.trim());
  };
  const cleanYN = (t?: string) =>
    /(yes|y)/i.test(t || '') ? 'Yes' : /(no|n)/i.test(t || '') ? 'No' : '';

  // map of label token sequences (1..5 tokens) to FormData key
  const labelTokenMappings: Array<{tokens: string[]; key: keyof FormData}> = [
    {tokens: ['DG', 'Hours'], key: 'dg_hours'},
    {tokens: ['EB', 'Hours'], key: 'eb_hours'},
    {tokens: ['Battery', 'Hours'], key: 'battery_hours'},
    {tokens: ['Technician', 'at', 'Site'], key: 'technician_at_site'},
    {tokens: ['Cumulative', 'EBRH'], key: 'cumulative_ebrh'},
    {tokens: ['Cumulative', 'BBRH'], key: 'cumulative_bbrh'},
    {tokens: ['Cumulative', 'DGRH'], key: 'cumulative_dgrh'},
    {tokens: ['DG', 'Status'], key: 'dg_status'},
    {tokens: ['DG', 'Type'], key: 'dg_type'},
    {tokens: ['QRC'], key: 'qrc'},
    {tokens: ['Read', 'QR', 'Code'], key: 'qrc'},
    {tokens: ['Opening', 'Stock'], key: 'opening_stock'},
    {tokens: ['Filled', 'Quantity'], key: 'filled_quantity'},
    {tokens: ['Filled', 'Qty'], key: 'filled_quantity'},
    {tokens: ['DG', 'HMR'], key: 'dg_hmr'},
    {tokens: ['PIU', 'HMR'], key: 'piu_hmr'},
    {tokens: ['Tank', 'Depth', 'Before'], key: 'tank_depth_before'},
    {tokens: ['Tank', 'Depth', 'After'], key: 'tank_depth_after'},
    {tokens: ['Location'], key: 'location'},
    {tokens: ['Coordinates'], key: 'coordinates'},
    {tokens: ['Date', 'Time'], key: 'date_time'},
  ];

  // safe escape for regex building
  const escapeRegExp = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  const extractFieldsFromRecognitionResult = (result: any, page: 1 | 2) => {
    const extracted: Partial<FormData> = {};

    // Build tokens array (preserving order) from structured elements if available,
    // otherwise split result.text into tokens with whitespace/newline split.
    const elements: Array<{text: string}> = [];

    try {
      if (result && Array.isArray(result.blocks)) {
        // flatten blocks/lines/elements tokens
        result.blocks.forEach((blk: any) => {
          if (blk && Array.isArray(blk.lines)) {
            blk.lines.forEach((ln: any) => {
              if (ln && Array.isArray(ln.elements)) {
                ln.elements.forEach((el: any) => {
                  const txt = norm(el?.text ?? el?.value ?? el);
                  if (txt) elements.push({text: txt});
                });
              } else if (ln && ln.text) {
                const txt = norm(ln.text);
                if (txt) elements.push({text: txt});
              }
            });
          } else if (blk && blk.text) {
            const txt = norm(blk.text);
            if (txt) elements.push({text: txt});
          }
        });
      } else if (result && Array.isArray(result.lines)) {
        result.lines.forEach((ln: any) => {
          const txt = norm(ln.text);
          if (txt) elements.push({text: txt});
        });
      } else if (result && typeof result.text === 'string') {
        const raw = result.text
          .split(/\s+/)
          .map(t => norm(t))
          .filter(Boolean);
        raw.forEach(t => elements.push({text: t}));
      }
    } catch (e) {
      console.warn('structured parsing failed', e);
    }

    // final tokens array
    const tokens = elements.map(e => e.text);

    console.log('Tokenized OCR:', tokens);

    // Extract QRC field - look for "Read QR Code" text sequence
    let qrcIdx = -1;
    for (let i = 0; i < tokens.length - 2; i++) {
      if (
        tokens[i] === 'QRC' ||
        tokens[i] === 'ORC' ||
        (tokens[i] === 'Read' &&
          tokens[i + 1] === 'QR' &&
          tokens[i + 2] === 'Code')
      ) {
        qrcIdx = i;
        break;
      }
    }

    if (qrcIdx >= 0) {
      // Check if next tokens form "Read QR Code"
      for (
        let i = qrcIdx + 1;
        i < Math.min(qrcIdx + 10, tokens.length - 2);
        i++
      ) {
        if (
          tokens[i] === 'Read' &&
          tokens[i + 1] === 'QR' &&
          tokens[i + 2] === 'Code'
        ) {
          extracted.qrc = 'Read QR Code';
          console.log('✓ qrc: Read QR Code');
          break;
        }
      }
    }

    // Find label indices
    let dgIdx = -1,
      ebIdx = -1,
      battIdx = -1,
      techIdx = -1;
    let ebrhIdx = -1,
      bbrhIdx = -1,
      dgrhIdx = -1;
    let openingStockIdx = -1,
      filledQtyIdx = -1;
    let dgHmrIdx = -1,
      piuHmrIdx = -1;
    let tankBeforeIdx = -1,
      tankAfterIdx = -1;

    for (let i = 0; i < tokens.length - 1; i++) {
      if (tokens[i] === 'DG' && tokens[i + 1] === 'Hours') dgIdx = i;
      if (tokens[i] === 'EB' && tokens[i + 1] === 'Hours') ebIdx = i;
      if (tokens[i] === 'Battery' && tokens[i + 1] === 'Hours') battIdx = i;
      if (
        tokens[i] === 'Technician' &&
        tokens[i + 1] === 'at' &&
        tokens[i + 2] === 'Site'
      )
        techIdx = i;
      if (tokens[i] === 'Cumulative' && tokens[i + 1] === 'EBRH') ebrhIdx = i;
      if (tokens[i] === 'Cumulative' && tokens[i + 1] === 'BBRH') bbrhIdx = i;
      if (tokens[i] === 'Cumulative' && tokens[i + 1] === 'DGRH') dgrhIdx = i;
      if (tokens[i] === 'Opening' && tokens[i + 1] === 'Stock')
        openingStockIdx = i;
      if (tokens[i] === 'Filled' && tokens[i + 1] === 'Quantity')
        filledQtyIdx = i;
      if (tokens[i] === 'DG' && tokens[i + 1] === 'HMR' && dgHmrIdx === -1)
        dgHmrIdx = i;
      if (tokens[i] === 'PIU' && tokens[i + 1] === 'HMR' && piuHmrIdx === -1)
        piuHmrIdx = i;
      if (
        tokens[i] === 'Tank' &&
        tokens[i + 1] === 'Depth' &&
        tokens[i + 2] === 'Before'
      )
        tankBeforeIdx = i;
      if (
        tokens[i] === 'Tank' &&
        tokens[i + 1] === 'Depth' &&
        tokens[i + 2] === 'After'
      )
        tankAfterIdx = i;
    }

    // Collect numeric tokens (integers and decimals)
    const pureIntegers: Array<{idx: number; val: string}> = [];
    const decimals: Array<{idx: number; val: string}> = [];
    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (/^\d+$/.test(t) && !t.includes('.') && !t.includes('-')) {
        const num = parseInt(t, 10);
        if (num >= 0 && num < 100000) pureIntegers.push({idx: i, val: t});
      } else if (/^\d+\.\d+$/.test(t)) {
        decimals.push({idx: i, val: t});
      }
    }

    // Find Yes/No
    let yesNoIdx = -1;
    for (let i = 0; i < tokens.length; i++) {
      if (/^Yes$/i.test(tokens[i])) {
        yesNoIdx = i;
        break;
      }
    }

    // Map by finding first unused integer after each label
    const used = new Set<number>();

    if (dgIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > dgIdx && !used.has(p.idx));
      if (found) {
        extracted.dg_hours = found.val;
        used.add(found.idx);
      }
    }
    if (ebIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > ebIdx && !used.has(p.idx));
      if (found) {
        extracted.eb_hours = found.val;
        used.add(found.idx);
      }
    }
    if (battIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > battIdx && !used.has(p.idx));
      if (found) {
        extracted.battery_hours = found.val;
        used.add(found.idx);
      }
    }
    if (techIdx >= 0 && yesNoIdx > techIdx) {
      extracted.technician_at_site = 'Yes';
    }
    if (ebrhIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > ebrhIdx && !used.has(p.idx));
      if (found) {
        extracted.cumulative_ebrh = found.val;
        used.add(found.idx);
      }
    }
    if (bbrhIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > bbrhIdx && !used.has(p.idx));
      if (found) {
        extracted.cumulative_bbrh = found.val;
        used.add(found.idx);
      }
    }
    if (dgrhIdx >= 0) {
      const found = pureIntegers.find(p => p.idx > dgrhIdx && !used.has(p.idx));
      if (found) {
        extracted.cumulative_dgrh = found.val;
        used.add(found.idx);
      }
    }
    // Extract in order, skipping invalid values (00, 0, single digits for HMR fields)
    if (openingStockIdx >= 0) {
      const found = pureIntegers.find(
        p => p.idx > openingStockIdx && !used.has(p.idx) && parseInt(p.val) > 0,
      );
      if (found) {
        extracted.opening_stock = found.val;
        used.add(found.idx);
        console.log('✓ opening_stock:', found.val);
      }
    }
    if (filledQtyIdx >= 0) {
      const found = pureIntegers.find(
        p => p.idx > filledQtyIdx && !used.has(p.idx) && parseInt(p.val) > 0,
      );
      if (found) {
        extracted.filled_quantity = found.val;
        used.add(found.idx);
        console.log('✓ filled_quantity:', found.val);
      }
    }
    if (dgHmrIdx >= 0) {
      const found = pureIntegers.find(
        p => p.idx > dgHmrIdx && !used.has(p.idx),
      );
      if (found) {
        extracted.dg_hmr = found.val;
        used.add(found.idx);
        console.log('✓ dg_hmr:', found.val);
      }
    }
    if (piuHmrIdx >= 0) {
      const found = pureIntegers.find(
        p => p.idx > piuHmrIdx && !used.has(p.idx),
      );
      if (found) {
        extracted.piu_hmr = found.val;
        used.add(found.idx);
        console.log('✓ piu_hmr:', found.val);
      }
    }
    const usedDecimals = new Set<number>();
    if (tankBeforeIdx >= 0) {
      const found = decimals.find(
        p =>
          p.idx > tankBeforeIdx &&
          !usedDecimals.has(p.idx) &&
          parseFloat(p.val) < 25,
      );
      if (found) {
        extracted.tank_depth_before = found.val;
        usedDecimals.add(found.idx);
        console.log('✓ tank_depth_before:', found.val);
      }
    }
    if (tankAfterIdx >= 0) {
      const found = decimals.find(
        p =>
          p.idx > tankAfterIdx &&
          !usedDecimals.has(p.idx) &&
          parseFloat(p.val) < 25,
      );
      if (found) {
        extracted.tank_depth_after = found.val;
        usedDecimals.add(found.idx);
        console.log('✓ tank_depth_after:', found.val);
      }
    }

    // Extract location (look for text in parentheses like "HARDADPUR")
    for (let i = 0; i < tokens.length; i++) {
      if (tokens[i] === '(' && i + 1 < tokens.length) {
        const locationText = tokens[i + 1].replace(/[()]/g, '');
        if (locationText && /^[A-Z]+$/.test(locationText)) {
          extracted.location = locationText;
          console.log('✓ location:', locationText);
          break;
        }
      } else if (/^\([A-Z]+\)$/.test(tokens[i])) {
        const locationText = tokens[i].replace(/[()]/g, '');
        extracted.location = locationText;
        console.log('✓ location:', locationText);
        break;
      } else if (
        /^[A-Z]{5,}$/.test(tokens[i]) &&
        tokens[i] !== 'HARDADPUR' &&
        i > 5
      ) {
        // Fallback: look for all-caps words
        if (tokens[i - 1] === '(' || /HARDADPUR|[A-Z]{5,}/.test(tokens[i])) {
          extracted.location = tokens[i].replace(/[()]/g, '');
          console.log('✓ location:', tokens[i]);
          break;
        }
      }
    }

    // Extract coordinates (look for two decimals > 25, typically lat/long)
    const coordDecimals = decimals.filter(p => parseFloat(p.val) > 25);
    if (coordDecimals.length >= 2) {
      extracted.coordinates = `${coordDecimals[0].val}, ${coordDecimals[1].val}`;
      console.log('✓ coordinates:', extracted.coordinates);
    }

    // Extract date_time (look for date pattern like DD-MM-YYYY and time)
    for (let i = 0; i < tokens.length; i++) {
      if (/^\d{2}-\d{2}-\d{4}$/.test(tokens[i])) {
        let dateTime = tokens[i];
        // Check next tokens for time
        if (i + 1 < tokens.length && /^\d{6}$/.test(tokens[i + 1])) {
          const timeStr = tokens[i + 1];
          const formatted = `${timeStr.slice(0, 2)}:${timeStr.slice(
            2,
            4,
          )}:${timeStr.slice(4, 6)}`;
          dateTime += ` ${formatted}`;
          if (i + 2 < tokens.length && /^(AM|PM)$/i.test(tokens[i + 2])) {
            dateTime += ` ${tokens[i + 2]}`;
          }
        }
        extracted.date_time = dateTime;
        console.log('✓ date_time:', dateTime);
        break;
      }
    }

    // --- 2) line-based regex fallback (label & value on same / next line) ---
    const fullText =
      result && typeof result.text === 'string'
        ? result.text
        : tokens.join(' ');
    const lines = fullText
      .split(/\r?\n/)
      .map(l => l.trim())
      .filter(Boolean);

    const tryLineRegex = (labelRegex: RegExp) => {
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // same line match: label ... number
        try {
          const reSame = new RegExp(
            labelRegex.source + '[^\\d\\n\\r]{0,10}(\\d{1,7}(?:\\.\\d+)?)',
            'i',
          );
          const mSame = line.match(reSame);
          if (mSame && mSame[1]) return mSame[1];
        } catch (e) {
          // ignore
        }
        // next-line match
        try {
          if (labelRegex.test(line) && i + 1 < lines.length) {
            const next = lines[i + 1];
            const mNext = next.match(/(\d{1,7}(?:\.\d+)?)/);
            if (mNext && mNext[1]) return mNext[1];
            if (/^(yes|no)$/i.test(next.trim())) return next.trim();
          }
        } catch (e) {
          // ignore
        }
      }
      return null;
    };

    // apply regex fallback for fields not found already
    const fallbackRegexMap: Array<{re: RegExp; key: keyof FormData}> = [
      {re: /DG\s*Hours?/i, key: 'dg_hours'},
      {re: /EB\s*Hours?/i, key: 'eb_hours'},
      {re: /Battery\s*Hours?/i, key: 'battery_hours'},
      {re: /Technician.*Site/i, key: 'technician_at_site'},
      {re: /Cumulative.*EBRH/i, key: 'cumulative_ebrh'},
      {re: /Cumulative.*BBRH/i, key: 'cumulative_bbrh'},
      {re: /Cumulative.*DGRH|DGRH/i, key: 'cumulative_dgrh'},
      {re: /Opening\s*Stock/i, key: 'opening_stock'},
      {re: /Filled\s*(?:Quantity|Qty)/i, key: 'filled_quantity'},
      {re: /DG\s*HMR/i, key: 'dg_hmr'},
      {re: /PIU\s*HMR/i, key: 'piu_hmr'},
      {re: /Tank\s*Depth\s*Before/i, key: 'tank_depth_before'},
      {re: /Tank\s*Depth\s*After/i, key: 'tank_depth_after'},
      {re: /DG\s*Status/i, key: 'dg_status'},
      {re: /DG\s*Type/i, key: 'dg_type'},
    ];

    for (const m of fallbackRegexMap) {
      const key = m.key;
      if ((extracted as any)[key]) continue; // skip if already found
      const val = tryLineRegex(m.re);
      if (val) {
        if (isYesNo(val)) (extracted as any)[key] = cleanYN(val);
        else (extracted as any)[key] = cleanNumber(val);
      }
    }

    // --- 3) special heuristics & final cleanups ---

    // If DG status/type appear as tokens like "Auto" "A" near "DG Status" / "DG Type"
    if (!extracted.dg_status) {
      // find exact token 'Auto' or 'Manual'
      const autoIdx = tokens.findIndex(t => /^auto$/i.test(t));
      if (autoIdx >= 0) extracted.dg_status = 'Auto';
      else {
        const manualIdx = tokens.findIndex(t => /^manual$/i.test(t));
        if (manualIdx >= 0) extracted.dg_status = 'Manual';
      }
    }
    if (!extracted.dg_type) {
      // look for single-letter tokens 'A','B','C' that appear near "DG Type" label tokens previously matched
      const typeToken = tokens.find(t => /^[A-C]$/i.test(t));
      if (typeToken) extracted.dg_type = typeToken.toUpperCase();
    }

    // HMR heuristic: If DG HMR or PIU HMR missing, pick large numeric tokens found in tokens but avoid small numbers like 15/55/62
    if (!extracted.dg_hmr || !extracted.piu_hmr) {
      const numericCandidates = tokens
        .map(t => ({t, n: parseFloat(cleanNumber(t) || 'NaN')}))
        .filter(x => !isNaN(x.n))
        .sort((a, b) => b.n - a.n);
      // prefer larger numbers (HMR often 3-6 digits)
      const hmrCandidates = numericCandidates.filter(x => x.n >= 100);
      if (!extracted.dg_hmr && hmrCandidates[0])
        extracted.dg_hmr = String(Math.round(hmrCandidates[0].n));
      if (!extracted.piu_hmr && hmrCandidates[1])
        extracted.piu_hmr = String(Math.round(hmrCandidates[1].n));
    }

    // Tank depths often have decimals like 2.0 or 16.0; ensure decimal kept
    ['tank_depth_before', 'tank_depth_after'].forEach(k => {
      const v = (extracted as any)[k];
      if (v && v.indexOf('.') === -1 && v.length > 0 && v.length <= 3) {
        // keep as-is; don't coerce
        (extracted as any)[k] = String(v);
      }
    });

    // If cumulative fields are empty but we have number sequence like [15,55,62,Yes,6840,4393,1922] try to map by order:
    // This is a last-resort mapping (only when tokens contain at least 6 numeric tokens)
    const numericSeq = tokens
      .map(t => cleanNumber(t))
      .filter(s => s && /^\d/.test(s));
    if (
      !(
        extracted.cumulative_ebrh ||
        extracted.cumulative_bbrh ||
        extracted.cumulative_dgrh
      )
    ) {
      // check for presence of expected numeric sequence length
      if (numericSeq.length >= 6) {
        // Find indexes of small top group numbers (15,55,62) to anchor sequence:
        // Try to find three consecutive small numbers (<1000) followed by three larger (>=100)
        for (let i = 0; i < numericSeq.length - 5; i++) {
          const a = parseFloat(numericSeq[i]),
            b = parseFloat(numericSeq[i + 1]),
            c = parseFloat(numericSeq[i + 2]);
          const d = parseFloat(numericSeq[i + 3]),
            e = parseFloat(numericSeq[i + 4]),
            f = parseFloat(numericSeq[i + 5]);
          if (
            !isNaN(a) &&
            !isNaN(b) &&
            !isNaN(c) &&
            !isNaN(d) &&
            !isNaN(e) &&
            !isNaN(f)
          ) {
            // heuristic: top three are small (<=200) and next three are larger (>=1000 or >=100)
            if (
              a <= 500 &&
              b <= 500 &&
              c <= 500 &&
              d >= 50 &&
              e >= 50 &&
              f >= 50
            ) {
              // map: a->dg_hours, b->eb_hours, c->battery_hours, d->cumulative_ebrh, e->cumulative_bbrh, f->cumulative_dgrh
              if (!extracted.dg_hours)
                extracted.dg_hours = String(Math.round(a));
              if (!extracted.eb_hours)
                extracted.eb_hours = String(Math.round(b));
              if (!extracted.battery_hours)
                extracted.battery_hours = String(Math.round(c));
              if (!extracted.cumulative_ebrh)
                extracted.cumulative_ebrh = String(Math.round(d));
              if (!extracted.cumulative_bbrh)
                extracted.cumulative_bbrh = String(Math.round(e));
              if (!extracted.cumulative_dgrh)
                extracted.cumulative_dgrh = String(Math.round(f));
              break;
            }
          }
        }
      }
    }

    const lineFallbackMap: Array<{label: RegExp; key: keyof FormData}> = [
      {label: /Opening\s*Stock/i, key: 'opening_stock'},
      {label: /Filled\s*(Quantity|Qty)/i, key: 'filled_quantity'},
      {label: /DG\s*HMR/i, key: 'dg_hmr'},
      {label: /PIU\s*HMR/i, key: 'piu_hmr'},
      {label: /Tank\s*Depth\s*Before/i, key: 'tank_depth_before'},
      {label: /Tank\s*Depth\s*After/i, key: 'tank_depth_after'},
    ];
    for (const item of lineFallbackMap) {
      const key = item.key;
      if ((extracted as any)[key]) continue;
      const found = tryLineRegex(item.label);
      if (found) (extracted as any)[key] = found;
    }

    // final convert all numeric-ish to strings
    Object.keys(extracted).forEach(k => {
      const val = (extracted as any)[k];
      if (val !== undefined && val !== null)
        (extracted as any)[k] = String(val);
    });

    console.log('Final extracted map:', extracted);
    return extracted;
  };

  const processImage = async (imageUri: string, page: 1 | 2) => {
    setIsProcessing(true);
    try {
      const result = await TextRecognition.recognize(imageUri);
      console.log(
        'Raw OCR text snippet:',
        typeof result === 'string'
          ? result.slice(0, 200)
          : (result?.text || '').slice(0, 200),
      );
      const extracted = extractFieldsFromRecognitionResult(result, page);
      console.log('✅ Extracted:', extracted);

      const updated = {...formData};
      let fieldsFound = 0;
      Object.keys(extracted).forEach(key => {
        const v = (extracted as any)[key];
        if (v !== undefined && v !== null && String(v).trim() !== '') {
          if (key in updated) {
            (updated as any)[key] = String(v);
            fieldsFound++;
          }
        }
      });

      setFormData(updated);
      if (page === 1) {
        setPage1Captured(true);
      } else {
        setPage2Captured(true);
      }
      setOcrCompleted(page1Captured || page === 1);

      Toast.show({
        type: fieldsFound > 0 ? 'success' : 'info',
        text1: fieldsFound > 0 ? 'OCR Success' : 'No Fields Found',
        text2:
          fieldsFound > 0
            ? `Extracted ${fieldsFound} fields`
            : 'Check console for detected text',
        position: 'top',
      });
    } catch (error) {
      console.error('OCR Error:', error);
      Alert.alert('OCR Failed', 'Please try again or enter data manually');
    } finally {
      setIsProcessing(false);
    }
  };

  const updateField = (key: keyof FormData, value: string) =>
    setFormData(prev => ({...prev, [key]: value}));

  const resetForm = () => {
    Alert.alert('Reset Form', 'Clear all fields?', [
      {text: 'Cancel', style: 'cancel'},
      {
        text: 'Reset',
        style: 'destructive',
        onPress: () => {
          setFormData({
            dg_hours: '',
            eb_hours: '',
            battery_hours: '',
            technician_at_site: '',
            cumulative_ebrh: '',
            cumulative_bbrh: '',
            cumulative_dgrh: '',
            dg_status: '',
            dg_type: '',
            qrc: '',
            opening_stock: '',
            filled_quantity: '',
            dg_hmr: '',
            piu_hmr: '',
            tank_depth_before: '',
            tank_depth_after: '',
            location: '',
            coordinates: '',
            date_time: '',
          });
          setOcrCompleted(false);
          setPage1Captured(false);
          setPage2Captured(false);
        },
      },
    ]);
  };

  const allFieldsFilled = () =>
    Object.values(formData).every(v => v && v.toString().trim() !== '');

  const handleProceed = () => {
    if (!allFieldsFilled()) {
      Alert.alert('Incomplete', 'Please fill all fields before proceeding');
      return;
    }
    orderStore.setState(state => ({...state, ocrData: formData}));
    Toast.show({
      type: 'success',
      text1: 'Data Saved',
      text2: 'OCR data saved successfully',
      position: 'top',
    });
    const currentDriverOrder = orderStore.getState().currentDriverOrder;
    if (currentDriverOrder?.is_enable_buddycan_flow)
      navigation.navigate('buddy-challan');
    else navigation.navigate('delivery-challan');
  };

  // ---------- UI (unchanged) ----------
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>OCR Form Reading</Text>
        <TouchableOpacity onPress={resetForm}>
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.buttonRow}>
          <TouchableOpacity
            style={[styles.pageBtn, page1Captured && styles.pageBtnSuccess]}
            onPress={() => openCamera(1)}
            disabled={isProcessing}>
            {isProcessing && currentPage === 1 ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.pageBtnText}>
                {page1Captured ? '✓ Page 1' : '📷 Page 1'}
              </Text>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.pageBtn,
              page2Captured && styles.pageBtnSuccess,
              !page1Captured && styles.pageBtnDisabled,
            ]}
            onPress={() => openCamera(2)}
            disabled={isProcessing || !page1Captured}>
            {isProcessing && currentPage === 2 ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.pageBtnText}>
                {page2Captured ? '✓ Page 2' : '📷 Page 2'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {isProcessing && (
          <View style={styles.processingBox}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.processingText}>Processing OCR...</Text>
          </View>
        )}

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Maintenance Information</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_hours}
                onChangeText={v => updateField('dg_hours', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>EB Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.eb_hours}
                onChangeText={v => updateField('eb_hours', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Battery Hours *</Text>
              <TextInput
                style={styles.input}
                value={formData.battery_hours}
                onChangeText={v => updateField('battery_hours', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Technician *</Text>
              <View style={styles.pickerContainer}>
                <RNPickerSelect
                  value={formData.technician_at_site}
                  onValueChange={v =>
                    updateField('technician_at_site', v || '')
                  }
                  items={[
                    {label: 'Yes', value: 'Yes'},
                    {label: 'No', value: 'No'},
                  ]}
                  placeholder={{label: 'Select...', value: null}}
                  style={{
                    inputIOS: styles.pickerInput,
                    inputAndroid: styles.pickerInput,
                  }}
                />
              </View>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cumulative Data</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>EBRH *</Text>
              <TextInput
                style={styles.input}
                value={formData.cumulative_ebrh}
                onChangeText={v => updateField('cumulative_ebrh', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>BBRH *</Text>
              <TextInput
                style={styles.input}
                value={formData.cumulative_bbrh}
                onChangeText={v => updateField('cumulative_bbrh', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <TextInput
            style={styles.inputFull}
            value={formData.cumulative_dgrh}
            onChangeText={v => updateField('cumulative_dgrh', v)}
            placeholder="Cumulative DGRH *"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Fuel & DG Data</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG Status *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_status}
                onChangeText={v => updateField('dg_status', v)}
                placeholder="Auto/Manual"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>DG Type *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_type}
                onChangeText={v => updateField('dg_type', v)}
                placeholder="A/B/C"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <TextInput
            style={styles.inputFull}
            value={formData.qrc}
            onChangeText={v => updateField('qrc', v)}
            placeholder="QRC *"
            placeholderTextColor="#999"
          />
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Opening Stock *</Text>
              <TextInput
                style={styles.input}
                value={formData.opening_stock}
                onChangeText={v => updateField('opening_stock', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Filled Qty *</Text>
              <TextInput
                style={styles.input}
                value={formData.filled_quantity}
                onChangeText={v => updateField('filled_quantity', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>DG HMR *</Text>
              <TextInput
                style={styles.input}
                value={formData.dg_hmr}
                onChangeText={v => updateField('dg_hmr', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>PIU HMR *</Text>
              <TextInput
                style={styles.input}
                value={formData.piu_hmr}
                onChangeText={v => updateField('piu_hmr', v)}
                keyboardType="numeric"
                placeholder="0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tank Information</Text>
          <View style={styles.row}>
            <View style={styles.field}>
              <Text style={styles.label}>Depth Before *</Text>
              <TextInput
                style={styles.input}
                value={formData.tank_depth_before}
                onChangeText={v => updateField('tank_depth_before', v)}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="#999"
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Depth After *</Text>
              <TextInput
                style={styles.input}
                value={formData.tank_depth_after}
                onChangeText={v => updateField('tank_depth_after', v)}
                keyboardType="numeric"
                placeholder="0.0"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Location & Time</Text>
          <TextInput
            style={styles.inputFull}
            value={formData.location}
            onChangeText={v => updateField('location', v)}
            placeholder="Location *"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.inputFull}
            value={formData.coordinates}
            onChangeText={v => updateField('coordinates', v)}
            placeholder="Coordinates *"
            placeholderTextColor="#999"
          />
          <TextInput
            style={styles.inputFull}
            value={formData.date_time}
            onChangeText={v => updateField('date_time', v)}
            placeholder="Date & Time *"
            placeholderTextColor="#999"
          />
        </View>
      </ScrollView>

      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[
            styles.proceedBtn,
            !allFieldsFilled() && styles.proceedBtnDisabled,
          ]}
          onPress={handleProceed}
          disabled={!allFieldsFilled()}>
          <Text style={styles.proceedBtnText}>Proceed</Text>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCamera}
        animationType="slide"
        onRequestClose={closeCamera}>
        <View style={styles.cameraContainer}>
          <RNCamera
            ref={cameraRef}
            style={styles.camera}
            type={RNCamera.Constants.Type.back}
            flashMode={RNCamera.Constants.FlashMode.auto}
            captureAudio={false}
            androidCameraPermissionOptions={{
              title: 'Permission to use camera',
              message: 'We need your permission to use your camera',
              buttonPositive: 'Ok',
              buttonNegative: 'Cancel',
            }}>
            <View style={styles.cameraOverlay}>
              <View style={styles.cameraHeader}>
                <TouchableOpacity
                  onPress={closeCamera}
                  style={styles.closeButton}>
                  <Text style={styles.closeButtonText}>✕ Close</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.cameraFooter}>
                <TouchableOpacity
                  onPress={takePicture}
                  style={styles.captureButton}>
                  <View style={styles.captureButtonInner} />
                </TouchableOpacity>
              </View>
            </View>
          </RNCamera>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f5f5f5'},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {fontSize: 18, fontWeight: 'bold', color: '#333'},
  resetText: {color: '#ef4444', fontSize: 14, fontWeight: '600'},
  content: {padding: 16, paddingBottom: 120},
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  pageBtn: {
    flex: 1,
    backgroundColor: '#3b82f6',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  pageBtnSuccess: {backgroundColor: '#10b981'},
  pageBtnDisabled: {backgroundColor: '#9ca3af', opacity: 0.5},
  pageBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  processingBox: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  processingText: {marginTop: 12, fontSize: 14, color: '#666'},
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  row: {flexDirection: 'row', gap: 12, marginBottom: 12},
  field: {flex: 1},
  label: {fontSize: 12, color: '#666', marginBottom: 4, fontWeight: '500'},
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    color: 'black',
  },
  inputFull: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 10,
    fontSize: 14,
    backgroundColor: '#fff',
    marginBottom: 12,
    color: 'black',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    padding: 16,
  },
  proceedBtn: {
    backgroundColor: '#3b82f6',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  proceedBtnDisabled: {backgroundColor: '#d1d5db', opacity: 0.6},
  proceedBtnText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  cameraContainer: {flex: 1, backgroundColor: '#000'},
  camera: {flex: 1},
  cameraOverlay: {flex: 1, backgroundColor: 'transparent'},
  cameraHeader: {paddingTop: 50, paddingHorizontal: 20},
  closeButton: {
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  closeButtonText: {color: '#fff', fontSize: 16, fontWeight: '600'},
  cameraFooter: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  captureButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: '#fff',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#fff',
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    backgroundColor: '#fff',
    height: 50,
  },
  pickerInput: {
    padding: 10,
    fontSize: 14,
    color: '#000',
  },
});

export default OCRReadingScreen;
