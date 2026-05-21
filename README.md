# Waggle 🐝

A mobile-first beekeeping inspection tracker for Chapman Apiaries, built for Peter Chapman's six colonies across two apiaries in the North East of England.

Waggle replaces a detailed Excel workbook with a fast, glove-friendly web app that works on iPhone, generates smart weekly action lists from inspection data, tracks queen lineage, and surfaces trend dashboards across seasons and years.

---

## Live app

| URL | Use |
|---|---|
| [waggle-peach.vercel.app](https://waggle-peach.vercel.app) | Mobile app — add to iPhone home screen |
| [waggle-peach.vercel.app/trends](https://waggle-peach.vercel.app/trends) | Trends & data dashboard — desktop/iPad |

### Adding to iPhone home screen
1. Open the app URL in **Safari**
2. Tap the **Share** button
3. Tap **Add to Home Screen**
4. Tap **Add**

The app will appear on the home screen like a native app — full screen, no browser bar.

---

## Features

### ✓ Built
- **Home screen** — weekly action list auto-generated from the previous inspection of each hive. High/medium/low priority actions with colour coding.
- **Inspection form** — full glove-friendly form covering queen, brood, stores, room, health, varroa, temperament, supers, feed, hive configuration, and weather. Large tap targets throughout.
- **Queen register** — full lineage record per queen with projected milestone dates (emergence, mating, first eggs) auto-calculated from QC capped date.
- **Inspection history** — full log of all inspections per hive.
- **Safety screen** — What3Words location, emergency contact, and SOS call button per apiary.
- **Trends dashboard** — colony health charts (brood, stores, temperament, varroa), honey harvest year-on-year, queen lineage tree with temperament comparison.

### 🔜 Planned
- **Data persistence** — Supabase PostgreSQL database (in progress)
- **Manual reminders** — free-text tasks per hive and per apiary
- **iCal export** — queen timing milestones to iPhone Calendar
- **Treatment & vet records** — legally required log for oxalic acid use under UK Veterinary Medicines Regulations 2013
- **Feed log** — year-round feeding tracker (syrup, fondant, pollen patties)
- **Inventory management** — equipment stock vs forecast needs
- **Push notifications** — overdue inspection and queen timing alerts

---

## Tech stack

| Layer | Technology |
|---|---|
| Front-end | React 18 + Vite |
| Styling | Inline styles (no CSS framework dependency) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (auto-deploys from GitHub) |
| PWA | Web manifest + mobile meta tags |

---

## Project structure

```
waggle/
├── public/
│   └── manifest.json       # PWA manifest
├── src/
│   ├── App.jsx             # Mobile app — all screens
│   ├── Trends.jsx          # Desktop dashboard — /trends
│   └── main.jsx            # Entry point + routing
├── index.html              # App shell
├── package.json
├── vite.config.js
└── vercel.json             # SPA routing config
```

---

## Development

### Prerequisites
- Node.js 18+

### Run locally
```bash
npm install
npm run dev
```
Open [http://localhost:5173](http://localhost:5173)

### Deploy
Push to the `main` branch on GitHub. Vercel deploys automatically within ~60 seconds.

---

## Data model

Eight core entities — full detail in the PRD.

| Entity | Description |
|---|---|
| **Apiary** | Named location (Farm, Home). Stores What3Words, emergency contact, landowner. |
| **Hive** | Physical box. Permanent number tied to the box, not the colony. |
| **Queen** | Individual queen with her own number. Tracks lineage, milestones, temperament. |
| **Inspection** | Single hive visit. Source for weekly action list and all trend charts. |
| **Treatment** | Varroa and disease treatments. Includes vet authorisation for oxalic acid. |
| **Feed log** | Year-round feeding events per hive. |
| **Harvest** | Honey extraction events with jar count and weight. |
| **Inventory** | Equipment stock management. |

---

## Apiaries

| Apiary | Location | Hives |
|---|---|---|
| Farm | Darlington, DL3 | Hives 1, 4, 5, 6 |
| Home | Durham | Hive 2 |

---

## Key beekeeping terms

| Term | Meaning |
|---|---|
| BIAS | Brood In All Stages — sign of a healthy laying queen |
| QC | Queen Cell |
| QE | Queen Excluder |
| Varroa drop | Mite count from sticky board — Low / Medium / High |
| Stores | Frames available for honey storage in brood box |
| Room | Frames available for queen to lay in brood box |
| Deadout | Colony that has died — box remains for reuse |
| Super | Box above QE where bees store surplus honey |
| WYRGB | Queen marking colour cycle — Yellow in 2026 |

---

## Background

Waggle was designed from a detailed PRD built around Peter's existing Excel beekeeping diary, covering six hives across two apiaries. The name comes from the waggle dance — the figure-eight movement bees use to communicate the direction and distance of a food source to the colony.

---

*Chapman Apiaries · North East England · Built May 2026*
