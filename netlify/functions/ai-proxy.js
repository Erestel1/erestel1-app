// ============================================================
// Erestel1 Intelligence — Unified Agent Proxy
// All 9 agents run through this Netlify Function
// ANTHROPIC_API_KEY stored securely as env variable
// ============================================================

const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

async function callClaude(system, userMessage, maxTokens = 800) {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_KEY,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: userMessage }]
    })
  })
  const data = await res.json()
  return data.content?.[0]?.text || ''
}

async function parseJSON(text) {
  try { return JSON.parse(text.replace(/```json|```/g, '').trim()) }
  catch(e) { return { error: 'parse failed', raw: text.slice(0, 200) } }
}

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' }
  }

  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }

  try {
    const body = JSON.parse(event.body)
    const mode = body.mode || 'chat'

    // ── MODE: CHAT (AI Partner chat) ──────────────────────────
    if (mode === 'chat') {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
        body: JSON.stringify(body)
      })
      const data = await res.json()
      return { statusCode: 200, headers, body: JSON.stringify(data) }
    }

    // ── MODE: GENERATE (Full 9-Agent Pipeline) ─────────────────
    if (mode === 'generate') {
      const results = {}

      // LAYER 1A — Existential Sentiment
      results.sentiment = await parseJSON(await callClaude(
        `You are the Existential Sentiment Analyst. Analyze global psychological signals about the post-work era.
Return JSON: { identity_crisis_score: 0-100, top_themes: [5 strings], geographic_hotspots: [3 regions], urgency: "low"|"medium"|"high"|"critical" }
Return ONLY valid JSON.`,
        `Analyze current 2025-2026 signals about: AI job displacement, identity crisis, meaning-seeking, remote living trends, UBI movements. Be specific and current.`
      ))

      // LAYER 1B — Religion & Meaning
      results.religion = await parseJSON(await callClaude(
        `You are the Religion & Meaning Analyst. Track how humans seek meaning as work disappears.
Return JSON: { religious_revival_score: 0-100, neo_spiritual_score: 0-100, top_movements: [3 strings], property_types_benefiting: [3 strings] }
Return ONLY valid JSON.`,
        `Analyze 2025-2026 trends in: religious revival, neo-spirituality, intentional communities, retreat centers, meaning-seeking movements globally.`
      ))

      // LAYER 1C — Geopolitics
      results.geopolitics = await parseJSON(await callClaude(
        `You are the Geopolitical Analyst for real estate investment.
Return JSON: { top_destination_countries: [{country: string, score: 0-100, reason: string}] (5 items), ubi_pilot_countries: [strings], nomad_visa_countries: [strings], geopolitical_risk_score: 0-100 }
Return ONLY valid JSON.`,
        `Analyze 2025-2026 geopolitical trends: nomad visa programs, UBI pilots, political stability, population movements, countries opening/closing to foreign investors.`
      ))

      // LAYER 1 SYNTHESIS
      results.synthesis1 = await parseJSON(await callClaude(
        `You are the Layer 1 Synthesis Agent. Combine anthropological signals into investment intelligence.
Return JSON: { global_transition_score: 0-100, investment_thesis: string, top_3_opportunity_regions: [strings], behavioral_predictions: [3 strings] }
Return ONLY valid JSON.`,
        `Synthesize: ${JSON.stringify({sentiment: results.sentiment, religion: results.religion, geopolitics: results.geopolitics})}. Extract the core investment opportunity.`
      ))

      // LAYER 2A — Cost of Living
      results.costliving = await parseJSON(await callClaude(
        `You are the Cost of Living Analyst. Rank cities for Airbnb real estate investment.
Return JSON: { top_cities: [{city: string, country: string, monthly_cost_eur: number, avg_purchase_price_eur: number, airbnb_potential: 0-100, investment_score: 0-100}] (5 items), best_value_city: string }
Return ONLY valid JSON.`,
        `Based on investment thesis: "${results.synthesis1?.investment_thesis || 'post-work coliving'}". Rank these for STR investment: Mussomeli Italy, Alentejo Portugal, Plovdiv Bulgaria, Kotor Montenegro, Chania Greece, Tbilisi Georgia, Évora Portugal, Rosh Pina Israel.`
      ))

      // LAYER 2B — Regulation
      results.regulation = await parseJSON(await callClaude(
        `You are the Regulatory Intelligence Analyst for Airbnb/STR investment.
Return JSON: { best_regulatory_countries: [{country: string, str_score: 0-100, tax_score: 0-100, foreigner_ownership: boolean, overall: 0-100}] (5 items), avoid_countries: [strings] }
Return ONLY valid JSON.`,
        `Analyze 2025-2026 STR regulations, Airbnb laws, foreign ownership rules, tax regimes for: Italy, Portugal, Bulgaria, Montenegro, Greece, Georgia, Israel, Croatia, Albania.`
      ))

      // LAYER 2C — Real Estate Market
      results.realestate = await parseJSON(await callClaude(
        `You are the Real Estate Market Analyst specializing in Airbnb ROI.
Return JSON: { best_market: {location: string, country: string, avg_purchase_eur: number, monthly_airbnb_revenue: number, annual_roi_pct: number, payback_years: number, occupancy_pct: number}, top_3_markets: [strings] }
Return ONLY valid JSON.`,
        `Based on top cities: ${JSON.stringify(results.costliving?.top_cities?.slice(0,3))}. Find the best Airbnb STR market with realistic 2025 numbers.`
      ))

      // LAYER 2 SYNTHESIS
      results.synthesis2 = await parseJSON(await callClaude(
        `You are the Geo Intelligence Synthesis Agent.
Return JSON: { #1_location: {city: string, country: string, why: string}, top_5_ranked: [{rank: number, location: string, score: 0-100}], market_timing: string }
Return ONLY valid JSON.`,
        `Cross-reference: cost=${JSON.stringify(results.costliving?.top_cities?.slice(0,2))}, regulation=${JSON.stringify(results.regulation?.best_regulatory_countries?.slice(0,2))}, realestate=${JSON.stringify(results.realestate?.best_market)}. Pick the #1 investment location.`
      ))

      // LAYER 3 — INCUBATOR (The Final Idea)
      const topLocation = results.synthesis2?.['#1_location'] || results.realestate?.best_market || { city: 'Mussomeli', country: 'Italy' }
      const thesis = results.synthesis1?.investment_thesis || 'Post-work identity crisis creates demand for community living'

      const idea = await callClaude(
        `You are the Applied Futurism Incubator — the creative brain of Erestel1 Intelligence.
Generate ONE complete, bold, actionable real estate investment concept for the post-work era.
Format EXACTLY:

🎯 CONCEPT: [Bold name]
📍 LOCATION: [Specific place, Country]
🧠 FUTURIST THESIS: [Why this works in 2030+ world — 2 sentences]
💼 BUSINESS MODEL: [How it makes money]
💰 FINANCIALS:
• Purchase price: €[X]
• Renovation: €[X]  
• Monthly Airbnb revenue: €[X]
• Annual gross: €[X]
• ROI: [X]%
• Payback: [X] years
🔥 WHY NOW: [Specific trend making this urgent]
📋 FIRST 5 ACTIONS:
1. [action + timeline]
2. [action + timeline]
3. [action + timeline]
4. [action + timeline]
5. [action + timeline]
⚠️ KEY RISKS: [2 risks]
⭐ CONFIDENCE: [X]/10`,
        `Intelligence briefing:
TOP LOCATION: ${JSON.stringify(topLocation)}
INVESTMENT THESIS: ${thesis}
REAL ESTATE DATA: ${JSON.stringify(results.realestate?.best_market)}
ANTHROPOLOGICAL SCORE: ${results.sentiment?.identity_crisis_score || 78}/100
GEO INTELLIGENCE: ${JSON.stringify(results.synthesis2)}

Generate the Applied Futurism investment concept. Be specific with real numbers.`,
        1200
      )

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          success: true,
          mode: 'generate',
          idea,
          intelligence: {
            sentiment_score: results.sentiment?.identity_crisis_score,
            top_location: topLocation,
            thesis,
            roi: results.realestate?.best_market?.annual_roi_pct
          }
        })
      }
    }

    // ── DEFAULT: pass through to Claude ───────────────────────
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify(body)
    })
    const data = await res.json()
    return { statusCode: 200, headers, body: JSON.stringify(data) }

  } catch (err) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: String(err) })
    }
  }
}
