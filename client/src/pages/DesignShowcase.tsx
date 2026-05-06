import { useState } from 'react';
import {
  Avatar,
  CategoryPill,
  StatusBadge,
  PersonFilterChips,
  TabBar,
  EmptyState,
  HeroMetric,
  OwnerCard,
  SummaryCard,
  SkelCard,
  SkelChart,
  SkelHero,
  SkelRow,
  PageSkeleton,
} from '@/components/design';
import type { FilterValue } from '@/components/design';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: 40 }}>
      <h2 style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--text-tertiary)', marginBottom: 16 }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-start' }}>
        {children}
      </div>
    </section>
  );
}

export default function DesignShowcase() {
  const [filter, setFilter] = useState<FilterValue>('tumu');
  const [tab, setTab] = useState('Gelirler');
  const [tab2, setTab2] = useState('Aylık');

  return (
    <div style={{ maxWidth: 960, margin: '0 auto', padding: '40px 24px' }}>
      <h1 style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.02em', marginBottom: 8 }}>
        Design Showcase
      </h1>
      <p style={{ color: 'var(--text-tertiary)', fontSize: 13, marginBottom: 40 }}>
        Claude Design v4 component library — izole test sayfası
      </p>

      {/* Avatar */}
      <Section title="Avatar">
        <Avatar who="yigit" size={40} />
        <Avatar who="arzu"  size={40} />
        <Avatar who="ev"    size={40} />
        <Avatar who="tumu"  size={40} />
        <Avatar who="yigit" size={64} />
        <Avatar who="arzu"  size={64} />
        <Avatar who="yigit" size={24} />
        <Avatar who="arzu"  size={24} />
      </Section>

      {/* CategoryPill */}
      <Section title="CategoryPill">
        <CategoryPill cat="konut"    size="md" />
        <CategoryPill cat="yiyecek"  size="md" />
        <CategoryPill cat="ulasim"   size="md" />
        <CategoryPill cat="saglik"   size="md" />
        <CategoryPill cat="eglence"  size="md" />
        <CategoryPill cat="abonelik" size="md" />
        <CategoryPill cat="giyim"    size="sm" />
        <CategoryPill cat="spor"     size="sm" />
        <CategoryPill cat="cocuk"    size="sm" />
        <CategoryPill cat="diger"    size="sm" />
        <CategoryPill cat="bilinmez" size="sm" />
      </Section>

      {/* StatusBadge */}
      <Section title="StatusBadge">
        <StatusBadge status="Odendi"   />
        <StatusBadge status="Bekliyor" />
        <StatusBadge status="Gecikti"  />
      </Section>

      {/* PersonFilterChips */}
      <Section title="PersonFilterChips">
        <div style={{ width: '100%' }}>
          <PersonFilterChips value={filter} onChange={setFilter} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>
            Seçili: <strong>{filter}</strong>
          </p>
        </div>
      </Section>

      {/* TabBar */}
      <Section title="TabBar">
        <div>
          <TabBar tabs={['Gelirler', 'Giderler', 'Limitler']} active={tab} onChange={setTab} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Aktif: {tab}</p>
        </div>
        <div>
          <TabBar tabs={['Aylık', 'Analitik']} active={tab2} onChange={setTab2} />
          <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 8 }}>Aktif: {tab2}</p>
        </div>
      </Section>

      {/* HeroMetric */}
      <Section title="HeroMetric">
        <div style={{ width: 280 }}>
          <HeroMetric
            label="NET DEĞER"
            value="€4,650.00"
            delta={{ value: '↑ €450 bu ay', positive: true }}
            subtitle="Mayıs 2026"
            action={{ label: 'Detay →', onClick: () => {} }}
          />
        </div>
        <div style={{ width: 280 }}>
          <HeroMetric
            label="TOPLAM GELİR"
            value="€6,050.00"
            delta={{ value: '↑ %8', positive: true }}
          />
        </div>
        <div style={{ width: 280 }}>
          <HeroMetric
            label="TOPLAM GİDER"
            value="€3,940.00"
            delta={{ value: '↑ %12', positive: false }}
            subtitle="Bütçe aşımı riski"
          />
        </div>
      </Section>

      {/* OwnerCard */}
      <Section title="OwnerCard">
        <div style={{ width: 260 }}>
          <OwnerCard
            who="yigit"
            title="YİGİT'İN GİDERLERİ"
            amount="€1,595.00"
            subtitle="Ev payı: €350.00"
            cats={['yiyecek', 'ulasim', 'spor']}
          />
        </div>
        <div style={{ width: 260 }}>
          <OwnerCard
            who="arzu"
            title="ARZU'NUN GİDERLERİ"
            amount="€850.00"
            subtitle="Ev payı: €175.00"
            cats={['eglence', 'abonelik']}
          />
        </div>
        <div style={{ width: 260 }}>
          <OwnerCard
            who="ev"
            title="ORTAK GİDERLER"
            amount="€1,815.00"
            subtitle="Her biri: €907.50"
            cats={['konut', 'saglik']}
          />
        </div>
      </Section>

      {/* SummaryCard */}
      <Section title="SummaryCard">
        <div style={{ width: 200 }}>
          <SummaryCard label="Toplam Gelir"  amount="€6,050" delta={{ value: '↗', positive: true }}  color="green" />
        </div>
        <div style={{ width: 200 }}>
          <SummaryCard label="Toplam Gider"  amount="€3,940" delta={{ value: '↘', positive: false }} color="red" />
        </div>
        <div style={{ width: 200 }}>
          <SummaryCard label="Kalan Para"    amount="€2,110" delta={{ value: '↗', positive: true }}  color="blue" />
        </div>
      </Section>

      {/* EmptyState */}
      <Section title="EmptyState">
        <div style={{ width: '100%', maxWidth: 480 }}>
          <EmptyState
            emoji="💸"
            title="Henüz gider eklenmemiş"
            description="İlk giderinizi ekleyerek harcamalarınızı takip etmeye başlayın."
            cta={{ label: 'Gider Ekle', onClick: () => alert('clicked') }}
          />
        </div>
        <div style={{ width: '100%', maxWidth: 480 }}>
          <EmptyState
            emoji="🎯"
            title="Hedef yok"
            description="Finansal hedef belirleyin ve birikim yapmaya başlayın."
          />
        </div>
      </Section>

      {/* Skeleton */}
      <Section title="Skeleton primitives">
        <div style={{ width: 320 }}>
          <SkelCard h={140} />
        </div>
        <div style={{ width: 320 }}>
          <SkelChart h={160} />
        </div>
        <div style={{ width: '100%' }}>
          <SkelHero />
        </div>
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
          <SkelRow />
          <SkelRow />
          <SkelRow />
        </div>
      </Section>

      {/* PageSkeleton */}
      <Section title="PageSkeleton — ana">
        <div style={{ width: '100%' }}>
          <PageSkeleton page="ana" />
        </div>
      </Section>
    </div>
  );
}
