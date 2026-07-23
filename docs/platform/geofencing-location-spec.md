# Mumzo — Location & Serviceability Module Spec (Production-Grade)

**Document Status:** Approved Feature & Production PRD  
**Target Launch:** Phase 1 (Hyderabad Launch & Multi-City Expansion)  
**Module Goal:** Simple, robust, fault-tolerant serviceability check engine with area-based ETA, zero heavy server overhead, and comprehensive edge-case handling.

---

## 1. Module Scope & Key Deliverables

### In-Scope (Phase 1 Deliverables)
1. **Admin Area & Pincode Management (`apps/admin`):**
   - Toggle active 6-digit Pincodes (e.g. `500081`, `500084`).
   - Draw simple visual service zones (polygons / circles) on an interactive map.
   - Set Area-Specific Delivery Rules: Active Status, **Target Delivery ETA** (e.g., "10 Mins", "15–20 Mins"), Delivery Fee, and Free Delivery Threshold.
   - Global / Per-Area **Surge & Emergency Switch** (e.g., "Rain Mode" to temporarily add +15 mins to ETA or pause express delivery).

2. **Storefront Location Gate (`apps/platform`):**
   - Auto-detect location via Browser GPS pin drop.
   - Locality & Pincode text search with autocomplete.
   - Instant serviceability check against Admin config with sub-10ms latency.
   - Area-based ETA display in header bar (e.g., `📍 Delivering to Kondapur in 15 Mins`).
   - Graceful "Unserviceable" modal with **Notify Me** demand logging.

3. **Resilient Backend & Caching Engine (`apps/server`):**
   - 2-Step fast check algorithm ($O(1)$ Pincode lookup + lightweight Point-in-Polygon check).
   - In-memory caching with instant admin cache invalidation.
   - Fallback strategies for API outages (e.g. reverse-geocoding failure).

### Out-of-Scope (Deferred to Phase 2)
- Real-time rider GPS tracking on map during transit (handled by order tracking module).
- Dynamic AI-driven traffic matrix integration (OSRM/Google Distance Matrix API calls on every request).

---

## 2. Area-Based Delivery ETA Architecture

Each configured area/pincode has explicit ETA rules defined by the Admin:

| Service Zone Type | Example Area | Target ETA Display | Operational Model |
|---|---|---|---|
| **Core Express Zone** | Kondapur, Madhapur, Gachibowli | **10–15 Mins** | Hyperlocal Partner Hub / Express Dispatch |
| **Outer Express Zone** | KPHB, Jubilee Hills Outer | **20–30 Mins** | Extended Partner Pickup Radius |
| **Standard Metro Zone** | Hyderabad Peripheral Pincodes | **Same-Day / 2–4 Hrs** | Scheduled Batch Dispatch |
| **National Fallback** | Non-serviced Cities / Pincodes | **1–3 Days** | Standard Third-Party Courier Shipping |

### Dynamic ETA Adjustment Rules:
- **Base ETA:** Defined per area in Admin panel (e.g. `15 mins`).
- **Surge / Weather Multiplier:**
  - Standard Mode: Base ETA (`15 mins`).
  - Rain / Heavy Traffic Mode: Base ETA + Buffer (e.g., `15 mins + 15 mins = 30 mins`).
  - High Order Volume Queue: Automatically appends `+10 mins` if active pending order count exceeds threshold.

---

## 3. Production Edge Cases & Resiliency Strategies

To ensure the system never breaks or blocks checkouts unexpectedly in production, the following edge cases are explicitly handled:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        PRODUCTION EDGE CASES                             │
├──────────────────────────┬──────────────────────────────────────────────┤
│ Edge Case Scene          │ Resilient Solution                           │
├──────────────────────────┼──────────────────────────────────────────────┤
│ 1. Address Switch at     │ Re-validate cart items against new location │
│    Checkout              │ before payment initiation; alert if cart invalid.│
│                          │                                              │
│ 2. Reverse Geocoding     │ Fall back to Pincode match immediately;      │
│    API Failure (Maps)    │ never block user shopping on external downtime.│
│                          │                                              │
│ 3. Boundary Pin Dropped  │ 100m fuzzy buffer zone around polygons to    │
│    on Border Line        │ prevent artificial rejection at street level.│
│                          │                                              │
│ 4. Admin Deactivates Area│ Invalidate server cache & re-check active    │
│    Mid-User Session      │ carts at payment gateway step.                │
│                          │                                              │
│ 5. Saved Address Pincode │ Primary check on exact GPS coordinates;      │
│    vs GPS Mismatch       │ fallback to Pincode if GPS signal is weak.   │
└──────────────────────────┴──────────────────────────────────────────────┘
```

### Detailed Edge Case Breakdown:

1. **Mid-Checkout Location Swap:**
   - *Risk:* User builds cart in a 10-min serviceable area (Kondapur), then switches saved address to an unserviceable or 24-hr area (Secunderabad) at payment step.
   - *Fix:* Re-run serviceability check on `POST /api/v1/orders/check-checkout`. If the new location is unserviceable or has different item availability, prompt user to confirm address update before charging payment.

2. **Third-Party Geocoding API Outage (Google Maps / MapmyIndia rate limit or downtime):**
   - *Risk:* Device returns `(lat, lng)`, but reverse geocoding API fails or times out ($> 1.5\text{ sec}$).
   - *Fix:* Fall back immediately to user's entered Pincode or stored neighborhood name. Never block user browsing due to third-party maps downtime.

3. **Boundary Pin Drop (The "Across the Street" Problem):**
   - *Risk:* Customer pin drop is 10 meters outside drawn polygon due to GPS noise.
   - *Fix:* Apply a 100-meter **Fuzzy Polygon Buffer Zone** around drawn map shapes to prevent false unserviceable flags for neighboring buildings.

4. **Concurrent Admin Policy Changes:**
   - *Risk:* Admin disables an area or toggles "Rain Mode" while thousands of users are browsing.
   - *Fix:* Use event-driven in-memory cache invalidation (`pub/sub` event across API instances). Active sessions update ETA on next navigation or cart modification.

5. **Weak GPS Signal / Low Accuracy Location:**
   - *Risk:* Mobile browser returns low accuracy GPS radius ($> 500\text{m}$).
   - *Fix:* Display prompt: *"GPS signal is low. Please confirm your exact building or select pincode."*

---

## 4. Feature Roadmap for Location Module

### Phase 1 (MVP - Launch Ready)
- [x] Pincode checklist & toggle manager in Admin.
- [x] Visual map polygon/circle drawer in Admin.
- [x] Sub-10ms 2-Step Serviceability API (`POST /api/v1/location/check-serviceability`).
- [x] Area-based delivery ETA badge in app header & product detail pages.
- [x] "Rain / Peak Surge Mode" emergency toggle in Admin.
- [x] "Notify Me" demand logger for unserviceable areas.

### Phase 2 (Growth & Operational Scalability)
- [ ] **Multi-Polygon Zone Layers:** Support per-store Core (10m), Outer (25m), and Buffer zones.
- [ ] **Automated Dynamic ETA:** Calculate live ETA based on active rider availability & store packing queue.
- [ ] **Demand Heatmap Analytics:** Admin map visualizer showing red/yellow clusters of unserviceable customer pin drops to identify next dark store / vendor hub locations.
- [ ] **Bulk GeoJSON Import/Export:** Import city municipality boundaries via standard GeoJSON files.

### Phase 3 (Scale & Expansion)
- [ ] **Multi-City & Multi-State Support:** Hierarchical location structure (State $\rightarrow$ City $\rightarrow$ Cluster $\rightarrow$ Zone).
- [ ] **Hyper-Local Surge Pricing:** Area-specific delivery fee dynamic surge based on weather, festival demand, or heavy rain.
- [ ] **Building-Level Gated Community Integration:** Special routing tags for major apartment complexes (e.g. My Home Bhooja, Jayabheri Silicon County).

---

## 5. Summary API Contract & Response Format

### Check Serviceability Request
`POST /api/v1/location/check-serviceability`
```json
{
  "lat": 17.4622,
  "lng": 78.3568,
  "pincode": "500084"
}
```

### Serviceable Response
```json
{
  "success": true,
  "data": {
    "isServiceable": true,
    "pincode": "500084",
    "areaName": "Kondapur",
    "deliveryEta": "15 Mins",
    "etaMinutes": 15,
    "deliveryFee": 15,
    "freeDeliveryThreshold": 199,
    "surge": {
      "active": false,
      "mode": null,
      "message": null
    }
  }
}
```

### Unserviceable Response
```json
{
  "success": true,
  "data": {
    "isServiceable": false,
    "pincode": "500084",
    "message": "We are expanding fast! Mumzo delivery isn't in your area yet.",
    "canNotify": true,
    "standardDeliveryAvailable": true,
    "standardEta": "1-2 Days"
  }
}
```
