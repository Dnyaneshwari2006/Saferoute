import { useState, useEffect } from 'react'
import LocationInput from './components/LocationInput'
import MapView from './components/MapView'
import RoutePanel from './components/RoutePanel'
import SafetyBriefing from './components/SafetyBriefing'
import SOSButton from './components/SOSButton'
import CrimeInfo from './components/CrimeInfo'
import HeatmapToggle from './components/HeatmapToggle'
import Community from './components/Community'
import SafetyTimer from './components/SafetyTimer'

const TABS = [
  { id: 'route',     label: '🗺 Route'      },
  { id: 'results',   label: '📍 Results'    },
  { id: 'community', label: '👥 Community'  },
  { id: 'safety',    label: '🔒 Safety Hub' },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('route')

  const [startLocation, setStartLocation] = useState(null)
  const [endLocation, setEndLocation] = useState(null)
  const [routes, setRoutes] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [activeRoute, setActiveRoute] = useState(0)
  const [featuresFound, setFeaturesFound] = useState(null)
  const [safetyPois, setSafetyPois] = useState(null)
  const [showHeatmap, setShowHeatmap] = useState(false)
  const [crimeHotspots, setCrimeHotspots] = useState([])
  const [showGuardian, setShowGuardian] = useState(false)

  const hasActiveGuardian = (() => {
    try {
      const saved = JSON.parse(localStorage.getItem('saferoute_guardian') || 'null')
      return saved && saved.phase === 'active'
    } catch { return false }
  })()

  const currentHour = new Date().getHours()
  const autoTimeMode = (currentHour >= 6 && currentHour < 18) ? 'day' : 'night'
  const [timeMode, setTimeMode] = useState(autoTimeMode)

  useEffect(() => {
    fetch('/api/crime-hotspots')
      .then(r => r.json())
      .then(data => setCrimeHotspots(data.hotspots || []))
      .catch(() => {})
  }, [])

  const findRoute = async () => {
    if (!startLocation || !endLocation) {
      setError('Please select both start and end locations')
      return
    }
    setLoading(true)
    setError(null)
    setRoutes(null)

    try {
      const resp = await fetch('/api/route', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          start_lat: startLocation.lat,
          start_lon: startLocation.lon,
          end_lat: endLocation.lat,
          end_lon: endLocation.lon,
          time_mode: timeMode,
        }),
      })
      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}))
        throw new Error(errData.error || 'Failed to find routes')
      }
      const data = await resp.json()
      setRoutes(data.routes)
      setFeaturesFound(data.features_found)
      setSafetyPois(data.safety_pois || [])
      setActiveRoute(0)
      // Auto-switch to Results tab once routes are ready
      setActiveTab('results')
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  const toggleTimeMode = () => setTimeMode(prev => prev === 'day' ? 'night' : 'day')

  return (
    <div className="app">
      <aside className="sidebar">

        {/* ── Header ── */}
        <div className="sidebar-header">
          <div className="sidebar-header-top">
            <div className="header-brand">
              <div className="header-icon">🛡️</div>
              <h1 className="header-title">SafeRoute</h1>
              <p className="header-tagline">Navigate safely, not just fast</p>
            </div>
          </div>
        </div>

        {/* ── Tab Bar ── */}
        <div className="tab-bar">
          {TABS.map(tab => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'active' : ''} ${activeTab === tab.id && tab.id === 'route' ? 'tab-route' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── Tab Content ── */}
        <div className="tab-content">

          {/* ══ ROUTE TAB ══ */}
          <div className={`tab-pane ${activeTab === 'route' ? 'active' : ''}`}>
            <div className="route-tab-body">

              <div className="search-section">
                <LocationInput
                  label="Start Location"
                  placeholder="e.g. Koregaon Park, Pune"
                  icon="📍"
                  onSelect={setStartLocation}
                />
                <LocationInput
                  label="Destination"
                  placeholder="e.g. Hinjewadi, Pune"
                  icon="🎯"
                  onSelect={setEndLocation}
                />
                <div className="time-mode-row">
                  <button
                    className={`time-toggle ${timeMode}`}
                    onClick={toggleTimeMode}
                    title={`Switch to ${timeMode === 'day' ? 'night' : 'day'} mode`}
                  >
                    <span className="time-icon">{timeMode === 'day' ? '☀️' : '🌙'}</span>
                    <span className="time-label">{timeMode === 'day' ? 'Day Mode' : 'Night Mode'}</span>
                  </button>
                  <span className="time-hint">
                    {timeMode === 'night' ? 'Lighting & police weighted higher' : 'Balanced safety scoring'}
                  </span>
                </div>
              </div>

              <button
                className="find-btn"
                onClick={findRoute}
                disabled={loading || !startLocation || !endLocation}
              >
                {loading
                  ? <><span className="spinner" /> Analyzing safety...</>
                  : '🔍 Find Safest Route'
                }
              </button>

              {error && <div className="error-msg">⚠️ {error}</div>}

              <button
                className={`guardian-trigger ${hasActiveGuardian ? 'has-active' : ''}`}
                onClick={() => setShowGuardian(true)}
              >
                <span className="guardian-trigger-icon">⏱️</span>
                <span className="guardian-trigger-text">
                  Guardian Mode
                  <span>Dead man's switch — your safety net</span>
                </span>
                {hasActiveGuardian
                  ? <span className="guardian-active-badge">ACTIVE</span>
                  : <span className="guardian-trigger-arrow">▸</span>
                }
              </button>

            </div>
          </div>

          {/* ══ RESULTS TAB ══ */}
          <div className={`tab-pane ${activeTab === 'results' ? 'active' : ''}`}>
            <div className="results-tab-body">
              {!routes && !loading ? (
                <div className="results-empty">
                  <div className="results-empty-icon">🗺️</div>
                  <div className="results-empty-text">
                    Set your start and destination on the Route tab, then tap <strong>Find Safest Route</strong> to see safety analysis here.
                  </div>
                </div>
              ) : loading ? (
                <div className="results-empty">
                  <div className="results-empty-icon">⏳</div>
                  <div className="results-empty-text">Analyzing safety data…</div>
                </div>
              ) : (
                <>
                  <RoutePanel
                    routes={routes}
                    activeRoute={activeRoute}
                    onSelect={setActiveRoute}
                    featuresFound={featuresFound}
                  />
                  <SafetyBriefing
                    route={routes[activeRoute]}
                    featuresFound={featuresFound}
                  />
                </>
              )}
            </div>
          </div>

          {/* ══ COMMUNITY TAB ══ */}
          <div className={`tab-pane ${activeTab === 'community' ? 'active' : ''}`}>
            <Community />
          </div>

          {/* ══ SAFETY HUB TAB ══ */}
          <div className={`tab-pane ${activeTab === 'safety' ? 'active' : ''}`}>
            <div className="safety-hub-body">

              <CrimeInfo areaName={startLocation?.primary || ''} />

              <div className="how-it-works">
                <h3>How it works</h3>
                <ul>
                  <li>🔦 Street lighting coverage</li>
                  <li>🚔 Police station proximity</li>
                  <li>🏥 Hospital accessibility</li>
                  <li>🏪 Commercial activity</li>
                  <li>🔴 AI crime hotspot mapping</li>
                  <li>🌙 Day/Night safety adjustment</li>
                  <li>🔥 Crime heatmap overlay</li>
                  <li>🤖 AI-powered safety analysis</li>
                  <li>📰 Real-time crime news scraping</li>
                </ul>
                <p>We analyze <strong>real Google Places data</strong> + <strong>Gemini AI crime analysis</strong> to find the safest path for you.</p>
              </div>

            </div>
          </div>

        </div>{/* end tab-content */}

        <div className="sidebar-footer">
          Powered by Google Places + Gemini AI · Built with ❤️
        </div>

      </aside>

      <main className="map-area">
        <MapView
          routes={routes}
          startLocation={startLocation}
          endLocation={endLocation}
          activeRoute={activeRoute}
          safetyPois={safetyPois}
          showHeatmap={showHeatmap}
          crimeHotspots={crimeHotspots}
        />
        <HeatmapToggle visible={showHeatmap} onToggle={setShowHeatmap} />
        <SOSButton
          startLocation={startLocation}
          endLocation={endLocation}
          routes={routes}
          activeRoute={activeRoute}
        />
        {showGuardian && <SafetyTimer onClose={() => setShowGuardian(false)} />}
      </main>
    </div>
  )
}