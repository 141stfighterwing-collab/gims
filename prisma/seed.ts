import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  // Clear existing data
  await prisma.forecast.deleteMany();
  await prisma.indexScore.deleteMany();
  await prisma.article.deleteMany();
  await prisma.region.deleteMany();

  // Seed Regions
  const regions = await Promise.all([
    prisma.region.create({ data: { name: 'Middle East', riskScore: 72, conflictCount: 14 } }),
    prisma.region.create({ data: { name: 'Eastern Europe', riskScore: 65, conflictCount: 8 } }),
    prisma.region.create({ data: { name: 'Indo-Pacific', riskScore: 58, conflictCount: 5 } }),
    prisma.region.create({ data: { name: 'East Africa', riskScore: 42, conflictCount: 6 } }),
    prisma.region.create({ data: { name: 'South Asia', riskScore: 38, conflictCount: 4 } }),
    prisma.region.create({ data: { name: 'Arctic', riskScore: 25, conflictCount: 1 } }),
  ]);

  // Seed Articles
  const articles = [
    {
      source: 'MSN / Defense News',
      url: 'https://www.msn.com/en-us/news/defense/pentagon-missile-procurement',
      title: 'Pentagon to Buy 10,000 Low-Cost Missiles Under New Deals',
      content: 'The Pentagon is set to procure over 10,000 cruise missiles in three years under agreements with defense contractors Anduril, CoAspire, Leidos, and Zone 5. The missiles will be adaptable for air, ground, or maritime launch, with testing beginning in 2026 before full-scale production.',
      summary: 'The Department of Defense has signed massive procurement contracts totaling potentially tens of billions of dollars with four defense contractors to produce 10,000+ low-cost cruise missiles. The program aims to dramatically expand US munitions stockpile amid growing global tensions.',
      whyMatters: 'This represents the largest single munitions procurement in modern US history, signaling preparation for potential high-intensity conflicts. The inclusion of newer defense tech firms like Anduril signals a strategic shift toward faster innovation cycles in weapons development.',
      publishedAt: new Date('2026-05-14T10:00:00Z'),
      fingerprint: 'pentagon-10000-missiles-2026',
      entities: JSON.stringify(['Pentagon', 'Anduril', 'CoAspire', 'Leidos', 'Zone 5', 'DoD']),
      tags: JSON.stringify(['military-contracts', 'missiles', 'procurement', 'US']),
      indexImpact: JSON.stringify({ 'military-contract-activity': 0.85, 'warfare-tech-acceleration': 0.6, 'strategic-surprise': 0.3 }),
    },
    {
      source: 'The Independent',
      url: 'https://www.the-independent.com/tech/china-drone-wireless-charging',
      title: 'China Unveils Breakthrough That May One Day Propel Drones Indefinitely',
      content: 'Chinese researchers have demonstrated a car-mounted microwave power transmission system capable of keeping drones airborne for over three hours through wireless energy transfer. The technology uses directed microwave beams to charge drone batteries mid-flight.',
      summary: 'China has revealed a groundbreaking wireless power transmission system for drones, using car-mounted microwave emitters to keep UAVs in the air for extended periods. This technology could revolutionize surveillance and military drone operations.',
      whyMatters: 'Wireless power transmission for drones eliminates one of the fundamental limitations of UAV operations - battery life. If militarized, this could enable persistent surveillance capabilities and extend strike drone loiter times dramatically, altering the calculus of drone warfare.',
      publishedAt: new Date('2026-05-13T14:30:00Z'),
      fingerprint: 'china-drone-wireless-power-2026',
      entities: JSON.stringify(['China', 'Chinese researchers']),
      tags: JSON.stringify(['drone-technology', 'china', 'wireless-power', 'military-tech', 'breakthrough']),
      indexImpact: JSON.stringify({ 'warfare-tech-acceleration': 0.9, 'strategic-surprise': 0.5, 'regional-conflict-risk': 0.3 }),
    },
    {
      source: 'Reuters',
      url: 'https://www.reuters.com/world/middle-east/iran-nuclear-2026',
      title: 'IAEA Reports Iran Has Expanded Uranium Enrichment to 90% Purity',
      content: 'The International Atomic Energy Agency has confirmed that Iran has begun enriching uranium to weapons-grade levels at its Fordow facility. Diplomatic efforts have stalled as Tehran rejects renewed negotiations.',
      summary: 'The IAEA has verified that Iran is now producing 90% enriched uranium at its Fordow underground facility, crossing a critical threshold toward weapons capability. International diplomatic efforts have failed to resume negotiations.',
      whyMatters: 'Iran achieving weapons-grade enrichment represents a direct threat to regional stability and non-proliferation norms. This dramatically escalates the US-Iran tension index and may trigger pre-emptive action from Israel or the US.',
      publishedAt: new Date('2026-05-12T08:00:00Z'),
      fingerprint: 'iran-nuclear-enrichment-90-2026',
      entities: JSON.stringify(['Iran', 'IAEA', 'Fordow']),
      tags: JSON.stringify(['nuclear', 'iran', 'proliferation', 'iaea', 'middle-east']),
      indexImpact: JSON.stringify({ 'us-iran-tension': 0.95, 'strategic-surprise': 0.7, 'regional-conflict-risk': 0.6 }),
    },
    {
      source: 'South China Morning Post',
      url: 'https://www.scmp.com/news/asia/south-china-sea-tensions',
      title: 'Philippines Reports New Chinese Maritime Militia Incursions in Scarborough Shoal',
      content: 'The Philippine military has detected over 40 Chinese maritime militia vessels operating within its exclusive economic zone near Scarborough Shoal, marking a significant escalation in ongoing territorial disputes.',
      summary: 'Philippine defense forces have identified a large fleet of Chinese maritime militia vessels encroaching on disputed waters near Scarborough Shoal, raising concerns about potential confrontations in the South China Sea.',
      whyMatters: 'The mass deployment of maritime militia vessels represents a gray-zone tactic that tests US-Philippines alliance commitments under the Mutual Defense Treaty. Any miscalculation could trigger a broader conflict.',
      publishedAt: new Date('2026-05-11T06:00:00Z'),
      fingerprint: 'china-philippines-scarborough-2026',
      entities: JSON.stringify(['Philippines', 'China', 'Scarborough Shoal']),
      tags: JSON.stringify(['south-china-sea', 'china', 'philippines', 'territorial-dispute']),
      indexImpact: JSON.stringify({ 'regional-conflict-risk': 0.7, 'strategic-surprise': 0.4 }),
    },
    {
      source: 'BBC News',
      url: 'https://www.bbc.com/news/world-europe-ukraine-2026',
      title: 'Ukraine Launches Major Counteroffensive in Eastern Donetsk Region',
      content: 'Ukrainian forces have launched a coordinated offensive operation along multiple axes in the eastern Donetsk region, utilizing newly received Western weapons systems including F-16s and ATACMS missiles.',
      summary: 'Ukraine has initiated its largest military operation in months, deploying advanced Western weaponry in a multi-pronged counteroffensive in Donetsk. The operation represents a significant escalation in the ongoing conflict with Russia.',
      whyMatters: 'The scale and timing of this counteroffensive, using newly delivered advanced systems, will test the effectiveness of Western military aid and could determine the trajectory of the Russia-Ukraine conflict for years to come.',
      publishedAt: new Date('2026-05-10T12:00:00Z'),
      fingerprint: 'ukraine-counteroffensive-donetsk-2026',
      entities: JSON.stringify(['Ukraine', 'Russia', 'Donetsk', 'NATO']),
      tags: JSON.stringify(['ukraine', 'russia', 'counteroffensive', 'nato', 'eastern-europe']),
      indexImpact: JSON.stringify({ 'regional-conflict-risk': 0.85, 'military-contract-activity': 0.5 }),
    },
    {
      source: 'Defense One',
      url: 'https://www.defenseone.com/technology/hypersonic-2026',
      title: 'US Successfully Tests New Hypersonic Missile with Mach 15 Capability',
      content: 'The US Air Force has completed a successful test of its latest hypersonic cruise missile, achieving sustained speeds of Mach 15 over a 1,000-mile test range. The weapon represents a generational leap in strike capability.',
      summary: 'The US Air Force confirmed a successful test of a new hypersonic weapon system reaching Mach 15 speeds. The missile traveled over 1,000 miles during the test, demonstrating advanced guidance and maneuverability at extreme speeds.',
      whyMatters: 'Hypersonic weapons development is accelerating globally, and this successful test narrows the capability gap with China and Russia. It signals the next era of great power competition in advanced weaponry.',
      publishedAt: new Date('2026-05-09T16:00:00Z'),
      fingerprint: 'us-hypersonic-mach15-test-2026',
      entities: JSON.stringify(['US Air Force', 'Pentagon']),
      tags: JSON.stringify(['hypersonic', 'weapons-test', 'us', 'technology', 'missiles']),
      indexImpact: JSON.stringify({ 'warfare-tech-acceleration': 0.8, 'military-contract-activity': 0.4 }),
    },
    {
      source: 'Wired',
      url: 'https://www.wired.com/story/ai-military-applications-2026',
      title: 'Pentagon Awards $2B for AI-Powered Autonomous Combat Systems',
      content: 'The Department of Defense has awarded a $2 billion contract for the development of AI-powered autonomous combat systems capable of operating in contested environments with minimal human oversight.',
      summary: 'The DoD has committed $2 billion to developing autonomous AI combat systems that can operate independently in high-threat environments. The program represents one of the largest AI military investments to date.',
      whyMatters: 'The deployment of autonomous AI systems in combat represents a paradigm shift in warfare ethics and strategy. This investment signals that autonomous weapons are moving from research to operational deployment.',
      publishedAt: new Date('2026-05-08T09:00:00Z'),
      fingerprint: 'pentagon-ai-autonomous-combat-2026',
      entities: JSON.stringify(['Pentagon', 'DoD']),
      tags: JSON.stringify(['ai', 'autonomous-systems', 'military', 'us', 'defense-contracts']),
      indexImpact: JSON.stringify({ 'warfare-tech-acceleration': 0.75, 'military-contract-activity': 0.7 }),
    },
    {
      source: 'Al Jazeera',
      url: 'https://www.aljazeera.com/news/middle-east/proxy-conflicts-2026',
      title: 'Houthi Forces Fire Advanced Missiles at Commercial Shipping in Red Sea',
      content: 'Houthi rebels have launched multiple advanced anti-ship missiles at commercial vessels in the Red Sea, disrupting one of the world\'s busiest shipping lanes. International naval forces have increased patrols in response.',
      summary: 'Houthi militants have escalated attacks on commercial shipping in the Red Sea using increasingly sophisticated missile systems, forcing major shipping companies to reroute vessels and increasing global supply chain costs.',
      whyMatters: 'Red Sea shipping disruptions have cascading effects on global trade and energy markets. The escalation of Houthi capabilities suggests continued Iranian support and represents a persistent threat to maritime security.',
      publishedAt: new Date('2026-05-07T11:00:00Z'),
      fingerprint: 'houthi-red-sea-shipping-2026',
      entities: JSON.stringify(['Houthis', 'Iran', 'Red Sea']),
      tags: JSON.stringify(['houthi', 'red-sea', 'shipping', 'iran-proxy', 'middle-east', 'maritime']),
      indexImpact: JSON.stringify({ 'us-iran-tension': 0.6, 'regional-conflict-risk': 0.5 }),
    },
    {
      source: 'NATO Official',
      url: 'https://www.nato.int/news/nato-defense-spending-2026',
      title: 'NATO Members Commit to 3% GDP Defense Spending by 2030',
      content: 'At the latest NATO summit, member states have agreed to increase defense spending targets to 3% of GDP by 2030, with several nations already exceeding the previous 2% threshold.',
      summary: 'NATO allies have unanimously agreed to raise defense spending to 3% of GDP within five years, marking the most significant increase in alliance defense commitments since the Cold War.',
      whyMatters: 'The 3% GDP target represents a massive reinvestment in Western defense capabilities, driven by perceived threats from Russia and China. This will generate significant new defense contracts and reshape the global defense industry.',
      publishedAt: new Date('2026-05-06T14:00:00Z'),
      fingerprint: 'nato-defense-spending-3pct-2026',
      entities: JSON.stringify(['NATO', 'European Union']),
      tags: JSON.stringify(['nato', 'defense-spending', 'europe', 'military-budget']),
      indexImpact: JSON.stringify({ 'military-contract-activity': 0.8, 'regional-conflict-risk': 0.4 }),
    },
    {
      source: 'CyberScoop',
      url: 'https://www.cyberscoop.com/cyber-warfare-state-sponsored-2026',
      title: 'Chinese State-Sponsored Hackers Breach Critical US Infrastructure Networks',
      content: 'Cybersecurity researchers have identified a massive Chinese state-sponsored intrusion campaign targeting US power grid operators and water treatment facilities, with some compromises dating back months.',
      summary: 'A sophisticated Chinese cyber espionage campaign has been uncovered, revealing deep penetration of US critical infrastructure including power grids and water systems. The scale of the operation suggests pre-positioning for potential conflict scenarios.',
      whyMatters: 'The penetration of critical infrastructure networks represents a form of strategic pre-positioning that could enable disruption during a conflict. This is a significant escalation in cyber warfare and adds to strategic surprise indicators.',
      publishedAt: new Date('2026-05-05T07:00:00Z'),
      fingerprint: 'china-cyber-us-infrastructure-2026',
      entities: JSON.stringify(['China', 'US', 'FBI', 'CISA']),
      tags: JSON.stringify(['cyber', 'china', 'critical-infrastructure', 'espionage', 'us']),
      indexImpact: JSON.stringify({ 'strategic-surprise': 0.8, 'us-iran-tension': 0.2 }),
    },
    {
      source: 'Times of India',
      url: 'https://timesofindia.indiatimes.com/india/pakistan-military-escalation',
      title: 'India and Pakistan Exchange Fire Along Line of Control Amid Rising Tensions',
      content: 'Indian and Pakistani military forces have engaged in artillery exchanges along the Line of Control in Kashmir, with both sides reporting casualties. Diplomatic channels have been activated to prevent further escalation.',
      summary: 'Cross-border artillery fire between India and Pakistan in Kashmir has resulted in casualties on both sides, marking the most serious escalation between the nuclear-armed neighbors in over two years.',
      whyMatters: 'Any escalation between nuclear-armed India and Pakistan carries existential risk for the region. The conflict diversion also impacts global attention on Indo-Pacific security dynamics.',
      publishedAt: new Date('2026-05-04T10:00:00Z'),
      fingerprint: 'india-pakistan-loc-escalation-2026',
      entities: JSON.stringify(['India', 'Pakistan', 'Kashmir']),
      tags: JSON.stringify(['india', 'pakistan', 'kashmir', 'nuclear', 'south-asia']),
      indexImpact: JSON.stringify({ 'regional-conflict-risk': 0.65, 'strategic-surprise': 0.5 }),
    },
    {
      source: 'Arctic Today',
      url: 'https://www.arctictoday.com/russia-arctic-militarization',
      title: 'Russia Reopens Soviet-Era Arctic Military Bases as Strategic Competition Grows',
      content: 'Russia has announced the reopening and modernization of several Soviet-era military installations in the Arctic, including air defense systems, radar stations, and submarine pens along the Northern Sea Route.',
      summary: 'Russia is rapidly reestablishing its military presence in the Arctic region, reopening and upgrading Cold War-era bases with modern air defense, radar, and naval infrastructure to secure its northern flank.',
      whyMatters: 'Arctic militarization adds a new theater of strategic competition. As ice recedes due to climate change, the region\'s shipping routes and resources become increasingly valuable, raising the risk of conflict.',
      publishedAt: new Date('2026-05-03T08:00:00Z'),
      fingerprint: 'russia-arctic-bases-reopen-2026',
      entities: JSON.stringify(['Russia', 'Arctic Council']),
      tags: JSON.stringify(['arctic', 'russia', 'militarization', 'strategic-competition']),
      indexImpact: JSON.stringify({ 'regional-conflict-risk': 0.35, 'strategic-surprise': 0.4 }),
    },
  ];

  for (const article of articles) {
    await prisma.article.create({ data: article });
  }

  // Seed Index Scores - 30 days of historical data for each index
  const indexNames = [
    'us-iran-tension',
    'warfare-tech-acceleration',
    'military-contract-activity',
    'regional-conflict-risk',
    'strategic-surprise',
  ];

  const baseRanges: Record<string, [number, number]> = {
    'us-iran-tension': [40, 75],
    'warfare-tech-acceleration': [55, 80],
    'military-contract-activity': [30, 70],
    'regional-conflict-risk': [35, 65],
    'strategic-surprise': [15, 35],
  };

  for (const indexName of indexNames) {
    const [min, max] = baseRanges[indexName];
    let currentScore = min + Math.random() * (max - min) * 0.5;

    for (let dayOffset = 29; dayOffset >= 0; dayOffset--) {
      const change = (Math.random() - 0.45) * 8;
      currentScore = Math.max(min, Math.min(max, currentScore + change));
      const decayedScore = currentScore * (0.88 + Math.random() * 0.1);

      const signals: Record<string, number> = {};
      const signalNames = getSignalNames(indexName);
      let remaining = 1;
      for (let i = 0; i < signalNames.length - 1; i++) {
        const val = Math.random() * remaining * 0.6;
        signals[signalNames[i]] = parseFloat(val.toFixed(2));
        remaining -= val;
      }
      signals[signalNames[signalNames.length - 1]] = parseFloat(remaining.toFixed(2));

      await prisma.indexScore.create({
        data: {
          indexName,
          score: parseFloat(currentScore.toFixed(1)),
          calculatedAt: new Date(Date.now() - dayOffset * 86400000),
          inputSignals: JSON.stringify(signals),
          decayedScore: parseFloat(decayedScore.toFixed(1)),
          region: indexName === 'regional-conflict-risk' ? 'Global' : undefined,
        },
      });
    }
  }

  // Seed Forecasts
  const forecasts = [
    {
      indexName: 'us-iran-tension',
      region: 'Middle East',
      forecastValue: 78.5,
      method: 'Linear Extrapolation',
      horizonDays: 14,
      confidence: 0.72,
      scenario: 'Increasing sanctions pressure and potential military escalation in the Persian Gulf region. Risk of Hormuz Strait disruption rises to 35%.',
    },
    {
      indexName: 'warfare-tech-acceleration',
      forecastValue: 82.0,
      method: 'Exponential Smoothing',
      horizonDays: 30,
      confidence: 0.81,
      scenario: 'Continued rapid advancement in drone, AI, and hypersonic technologies driven by US-China competition. Three or more significant breakthroughs expected.',
    },
    {
      indexName: 'military-contract-activity',
      forecastValue: 68.0,
      method: 'ARIMA Forecast',
      horizonDays: 21,
      confidence: 0.65,
      scenario: 'NATO spending commitments and Indo-Pacific deterrence initiatives expected to generate $50B+ in new contract announcements.',
    },
    {
      indexName: 'regional-conflict-risk',
      region: 'Eastern Europe',
      forecastValue: 70.0,
      method: 'Scenario Analysis',
      horizonDays: 14,
      confidence: 0.58,
      scenario: 'Ukraine counteroffensive outcome will determine regional trajectory. Best case: negotiation window opens. Worst case: conflict expands to NATO borders.',
    },
    {
      indexName: 'strategic-surprise',
      forecastValue: 32.0,
      method: 'Anomaly Detection',
      horizonDays: 7,
      confidence: 0.45,
      scenario: 'Unusual communications patterns detected in multiple regions. Pattern analysis suggests potential for unexpected developments in next 7 days.',
    },
    {
      indexName: 'us-iran-tension',
      region: 'Middle East',
      forecastValue: 85.0,
      method: 'Monte Carlo Simulation',
      horizonDays: 60,
      confidence: 0.38,
      scenario: 'Long-term worst-case scenario: nuclear program reaches weaponization threshold, triggering regional arms race and potential preemptive strike scenarios.',
    },
    {
      indexName: 'warfare-tech-acceleration',
      forecastValue: 75.0,
      method: 'Trend Analysis',
      horizonDays: 90,
      confidence: 0.55,
      scenario: 'Expected breakthroughs in autonomous AI combat systems and quantum-secured communications will sustain high acceleration scores through Q3 2026.',
    },
  ];

  for (const forecast of forecasts) {
    await prisma.forecast.create({
      data: {
        ...forecast,
        triggeredAt: new Date(Date.now() - Math.floor(Math.random() * 7) * 86400000),
      },
    });
  }

  console.log('Database seeded successfully!');
  console.log(`  - ${regions.length} regions`);
  console.log(`  - ${articles.length} articles`);
  console.log(`  - ${indexNames.length * 30} index scores`);
  console.log(`  - ${forecasts.length} forecasts`);
}

function getSignalNames(indexName: string): string[] {
  const signals: Record<string, string[]> = {
    'us-iran-tension': ['sanctions', 'military_deployments', 'proxy_attacks', 'diplomatic_statements', 'nuclear_developments', 'hormuz_incidents', 'cyber_attacks'],
    'warfare-tech-acceleration': ['weapons_tests', 'budget_increases', 'tech_breakthroughs', 'hypersonic_tests', 'drone_advances', 'arms_race_indicators'],
    'military-contract-activity': ['contract_announcements', 'dollar_volume', 'contractor_count', 'multi_year_deals', 'emerging_vendors', 'fms_deals'],
    'regional-conflict-risk': ['armed_clashes', 'troop_movements', 'diplomatic_breakdowns', 'civilian_casualties', 'alliance_shifts', 'resource_disputes', 'escalation_indicators'],
    'strategic-surprise': ['unusual_movements', 'comms_blackouts', 'leadership_changes', 'economic_shocks', 'intelligence_warnings', 'pattern_deviations', 'alliance_changes'],
  };
  return signals[indexName] || [];
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
