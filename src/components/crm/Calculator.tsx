import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Card, Select, Spin, Typography } from 'antd';

const { Text } = Typography;
const { Option } = Select;

type Currency = 'USD' | 'EUR' | 'RUB' | 'KZT';
const CURRENCIES: Currency[] = ['USD', 'EUR', 'RUB', 'KZT'];

const META: Record<Currency, { name: string; symbol: string; flag: string }> = {
  USD: { name: 'Доллар США',          symbol: '$', flag: '🇺🇸' },
  EUR: { name: 'Евро',                symbol: '€', flag: '🇪🇺' },
  RUB: { name: 'Рос. рубль',          symbol: '₽', flag: '🇷🇺' },
  KZT: { name: 'Тенге',               symbol: '₸', flag: '🇰🇿' },
};

interface RateInfo {
  rate: number;   // KZT per 1 unit of currency
  change: number; // daily change in KZT
}

const PAIRS: [Currency, Currency][] = [
  ['USD', 'KZT'], ['EUR', 'KZT'], ['RUB', 'KZT'],
  ['EUR', 'USD'], ['RUB', 'USD'], ['EUR', 'RUB'],
];

function fmtInput(n: number, to: Currency): string {
  if (!isFinite(n) || isNaN(n)) return '';
  const d = to === 'KZT' ? 2 : to === 'RUB' ? 2 : 4;
  return n.toFixed(d);
}

function fmtRate(n: number, to: Currency): string {
  if (!isFinite(n) || isNaN(n) || n === 0) return '—';
  const d = to === 'KZT' ? 2 : to === 'RUB' ? 4 : 6;
  return n.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: d });
}

const ForexConverter: React.FC = () => {
  const [rates, setRates]         = useState<Partial<Record<Currency, RateInfo>>>({});
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<Date | null>(null);
  const [src, setSrc]             = useState('НУЦ РК');

  const [base, setBase]       = useState<Currency>('USD');
  const [quoted, setQuoted]   = useState<Currency>('KZT');
  const [baseAmt, setBaseAmt]     = useState('1');
  const [quotedAmt, setQuotedAmt] = useState('');

  // ref so the recalc effect can read current baseAmt without it being a dep
  const baseAmtRef = useRef(baseAmt);
  useEffect(() => { baseAmtRef.current = baseAmt; }, [baseAmt]);

  const buildKztMap = useCallback(
    (): Record<Currency, number> => ({
      KZT: 1,
      USD: rates.USD?.rate ?? 0,
      EUR: rates.EUR?.rate ?? 0,
      RUB: rates.RUB?.rate ?? 0,
    }),
    [rates],
  );

  const cvt = useCallback(
    (amount: number, from: Currency, to: Currency): number => {
      const r = buildKztMap();
      if (!r[from] || !r[to]) return NaN;
      return amount * r[from] / r[to];
    },
    [buildKztMap],
  );

  const fetchRates = useCallback(async () => {
    setLoading(true);
    setError(null);

    const d  = new Date();
    const ds = `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;

    // Primary: National Bank of Kazakhstan via CORS proxy
    try {
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
        `https://nationalbank.kz/rss/get_rates.cfm?fdate=${ds}`,
      )}`;
      const res  = await fetch(proxyUrl, { signal: AbortSignal.timeout(8000) });
      const json = await res.json() as { contents: string };
      const doc  = new DOMParser().parseFromString(json.contents, 'text/xml');
      const out: Partial<Record<Currency, RateInfo>> = {};

      doc.querySelectorAll('item').forEach(item => {
        const code  = item.querySelector('title')?.textContent?.trim() as Currency;
        const quant = parseFloat(item.querySelector('quant')?.textContent  ?? '1');
        const index = parseFloat(item.querySelector('index')?.textContent  ?? '0');
        const chng  = parseFloat(item.querySelector('change')?.textContent ?? '0');
        if (['USD', 'EUR', 'RUB'].includes(code)) {
          out[code] = { rate: index / quant, change: chng / quant };
        }
      });

      if (out.USD && out.EUR && out.RUB) {
        setRates(out);
        setSrc('НУЦ РК');
        setUpdatedAt(new Date());
        setLoading(false);
        return;
      }
    } catch { /* fall through to backup */ }

    // Fallback: fawazahmed0 free currency API
    try {
      const res  = await fetch(
        'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/kzt.json',
        { signal: AbortSignal.timeout(8000) },
      );
      const data = await res.json() as { kzt: Record<string, number> };
      const r    = data.kzt;
      setRates({
        USD: { rate: 1 / r.usd, change: 0 },
        EUR: { rate: 1 / r.eur, change: 0 },
        RUB: { rate: 1 / r.rub, change: 0 },
      });
      setSrc('Резервный API');
      setUpdatedAt(new Date());
    } catch {
      setError('Не удалось загрузить курсы. Проверьте подключение к интернету.');
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchRates(); }, [fetchRates]);

  // Recalculate quoted amount when rates load or currencies switch
  useEffect(() => {
    if (!rates.USD) return;
    const n = parseFloat(baseAmtRef.current);
    if (isFinite(n) && n > 0) {
      setQuotedAmt(fmtInput(cvt(n, base, quoted), quoted));
    }
  }, [rates, base, quoted, cvt]);

  const onBaseAmtChange = (v: string) => {
    const clean = v.replace(',', '.');
    setBaseAmt(clean);
    const n = parseFloat(clean);
    if (isFinite(n) && n >= 0 && rates.USD) {
      setQuotedAmt(fmtInput(cvt(n, base, quoted), quoted));
    } else {
      setQuotedAmt('');
    }
  };

  const onQuotedAmtChange = (v: string) => {
    const clean = v.replace(',', '.');
    setQuotedAmt(clean);
    const n = parseFloat(clean);
    if (isFinite(n) && n >= 0 && rates.USD) {
      setBaseAmt(fmtInput(cvt(n, quoted, base), base));
    } else {
      setBaseAmt('');
    }
  };

  const onBaseChange = (c: Currency) => {
    const newQuoted = c === quoted ? base : quoted;
    setBase(c);
    setQuoted(newQuoted);
    const n = parseFloat(baseAmt);
    if (isFinite(n) && rates.USD) {
      setQuotedAmt(fmtInput(cvt(n, c, newQuoted), newQuoted));
    }
  };

  const onQuotedChange = (c: Currency) => {
    const newBase = c === base ? quoted : base;
    setBase(newBase);
    setQuoted(c);
    const n = parseFloat(baseAmt);
    if (isFinite(n) && rates.USD) {
      setQuotedAmt(fmtInput(cvt(n, newBase, c), c));
    }
  };

  // Swap: the quoted value becomes the new base; quoted is recalculated
  const onSwap = () => {
    const newBase    = quoted;
    const newQuoted  = base;
    const newBaseAmt = quotedAmt || '0';
    setBase(newBase);
    setQuoted(newQuoted);
    setBaseAmt(newBaseAmt);
    const n = parseFloat(newBaseAmt.replace(/\s/g, '').replace(',', '.'));
    if (isFinite(n) && rates.USD) {
      setQuotedAmt(fmtInput(cvt(n, newBase, newQuoted), newQuoted));
    }
  };

  const getRateStr = (from: Currency, to: Currency): string => {
    const r = buildKztMap();
    if (!r[from] || !r[to]) return '—';
    return fmtRate(r[from] / r[to], to);
  };

  const inputStyle: React.CSSProperties = {
    border: 'none', outline: 'none',
    fontSize: 22, fontWeight: 600,
    width: '100%', fontFamily: 'inherit',
    background: 'transparent',
  };

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>

      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #085041 0%, #1D9E75 100%)',
        borderRadius: '16px 16px 0 0',
        padding: '18px 24px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <Text style={{ color: '#fff', fontSize: 17, fontWeight: 700, display: 'block' }}>
            Форекс • Конвертер
          </Text>
          <Text style={{ color: 'rgba(255,255,255,0.65)', fontSize: 12 }}>
            {loading
              ? 'Загрузка...'
              : error
              ? 'Ошибка загрузки'
              : `${src}${updatedAt
                  ? ` • ${updatedAt.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}`
                  : ''}`}
          </Text>
        </div>
        <button
          onClick={fetchRates}
          disabled={loading}
          style={{
            background: 'rgba(255,255,255,0.15)', border: 'none',
            borderRadius: 8, padding: '6px 14px',
            color: '#fff', cursor: loading ? 'not-allowed' : 'pointer', fontSize: 13,
          }}
        >
          ↻ Обновить
        </button>
      </div>

      <Card
        bordered={false}
        style={{ borderRadius: '0 0 16px 16px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}
        styles={{ body: { padding: 0 } }}
      >

        {/* Live rates grid */}
        <div style={{ padding: '16px 24px 20px', borderBottom: '1px solid #f0f0f0' }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Актуальные курсы
          </Text>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '24px 0' }}><Spin /></div>
          ) : error ? (
            <Text type="danger" style={{ display: 'block', marginTop: 10, fontSize: 13 }}>{error}</Text>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10 }}>
              {PAIRS.map(([from, to]) => {
                const chng      = from !== 'KZT' ? (rates[from]?.change ?? 0) : 0;
                const showChng  = to === 'KZT' && chng !== 0;
                return (
                  <div
                    key={`${from}${to}`}
                    style={{ background: '#f8f9fa', borderRadius: 10, padding: '10px 12px', border: '1px solid #eee' }}
                  >
                    <div style={{ fontSize: 11, color: '#888', marginBottom: 4 }}>
                      {META[from].flag} {from}/{to}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1a1a1a' }}>
                      {getRateStr(from, to)}
                    </div>
                    {showChng && (
                      <div style={{ fontSize: 11, color: chng > 0 ? '#1D9E75' : '#ff4d4f', marginTop: 2 }}>
                        {chng > 0 ? '▲' : '▼'} {Math.abs(chng).toFixed(2)} ₸
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Converter */}
        <div style={{ padding: '20px 24px 28px' }}>
          <Text style={{ fontSize: 11, fontWeight: 600, color: '#aaa', letterSpacing: 1.2, textTransform: 'uppercase' }}>
            Конвертер
          </Text>

          <div style={{ display: 'flex', alignItems: 'flex-end', gap: 12, marginTop: 12 }}>

            {/* Base currency */}
            <div style={{ flex: 1 }}>
              <Select value={base} onChange={onBaseChange} style={{ width: '100%', marginBottom: 8 }} size="large">
                {CURRENCIES.map(c => (
                  <Option key={c} value={c}>
                    {META[c].flag} {c} — {META[c].name}
                  </Option>
                ))}
              </Select>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1.5px solid #d9d9d9', borderRadius: 10,
                padding: '8px 14px', background: '#fff',
              }}>
                <span style={{ color: '#ccc', marginRight: 6, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {META[base].symbol}
                </span>
                <input
                  value={baseAmt}
                  onChange={e => onBaseAmtChange(e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            </div>

            {/* Swap button */}
            <button
              onClick={onSwap}
              disabled={loading}
              style={{
                background: loading ? '#e0e0e0' : '#1D9E75',
                border: 'none', borderRadius: '50%',
                width: 44, height: 44, flexShrink: 0,
                cursor: loading ? 'not-allowed' : 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: 20,
                boxShadow: loading ? 'none' : '0 2px 10px rgba(29,158,117,0.35)',
                marginBottom: 2,
              }}
              title="Поменять валюты"
            >
              ⇄
            </button>

            {/* Quoted currency */}
            <div style={{ flex: 1 }}>
              <Select value={quoted} onChange={onQuotedChange} style={{ width: '100%', marginBottom: 8 }} size="large">
                {CURRENCIES.map(c => (
                  <Option key={c} value={c}>
                    {META[c].flag} {c} — {META[c].name}
                  </Option>
                ))}
              </Select>
              <div style={{
                display: 'flex', alignItems: 'center',
                border: '1.5px solid #e8e8e8', borderRadius: 10,
                padding: '8px 14px', background: '#fafafa',
              }}>
                <span style={{ color: '#ccc', marginRight: 6, fontSize: 16, fontWeight: 700, flexShrink: 0 }}>
                  {META[quoted].symbol}
                </span>
                <input
                  value={quotedAmt}
                  onChange={e => onQuotedAmtChange(e.target.value)}
                  style={inputStyle}
                  placeholder="0"
                  disabled={loading}
                />
              </div>
            </div>
          </div>

          {/* Rate summary */}
          {!loading && !error && rates.USD && (
            <div style={{
              marginTop: 14, padding: '10px 16px',
              background: '#f0faf6', borderRadius: 10,
              border: '1px solid #c6f0e0',
              display: 'flex', gap: 24, flexWrap: 'wrap',
            }}>
              <Text style={{ fontSize: 13, color: '#085041' }}>
                1 {base} = {getRateStr(base, quoted)} {quoted}
              </Text>
              <Text style={{ fontSize: 13, color: '#085041' }}>
                1 {quoted} = {getRateStr(quoted, base)} {base}
              </Text>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default ForexConverter;
