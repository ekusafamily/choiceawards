# DeKUTSO Comrade Choice Awards 2026
## Restoration & Transition Guide: Moving from "Nominations Phase" to "Voting Phase"

> **Purpose of this document:**  
> During the current stage of the awards, the portal is strictly in the **Nominations Phase**. To prevent voter confusion and preserve integrity before the voting window opens, all voting buttons, points tallies, rankings, the podium grid, and the live results tab have been temporarily hidden or commented out.
>  
> This file contains the exact catalog of everything hidden, the affected files, code snippets, and turnkey instructions to restore full voting functionality when voting officially commences.

---

## Table of Contents
1. [Overview of What Is Currently Hidden](#1-overview-of-what-is-currently-hidden)
2. [Navigation & Routing Restoration](#2-navigation--routing-restoration)
   - [2.1 Navbar (`client/src/components/Navbar.jsx`)](#21-navbar-clientsrccomponentsnavbarjsx)
   - [2.2 Footer (`client/src/components/Footer.jsx`)](#22-footer-clientsrccomponentsfooterjsx)
   - [2.3 App Routes (`client/src/App.jsx`)](#23-app-routes-clientsrcappjsx)
3. [Podium & Rankings Restoration](#3-podium--rankings-restoration)
   - [3.1 Top Nominees & Podium (`client/src/pages/TopNominees.jsx`)](#31-top-nominees--podium-clientsrcpagestopnomineesjsx)
4. [Voting Buttons Restoration](#4-voting-buttons-restoration)
   - [4.1 Nominee Card (`client/src/components/NomineeCard.jsx`)](#41-nominee-card-clientsrccomponentsnomineecardjsx)
   - [4.2 Nominee Profile (`client/src/pages/NomineeProfile.jsx`)](#42-nominee-profile-clientsrcpagesnomineeprofilejsx)
   - [4.3 Landing Search Bar (`client/src/components/LandingSearchBar.jsx`)](#43-landing-search-bar-clientsrccomponentslandingsearchbarjsx)
   - [4.4 Standalone Share Card (`server/src/routes/share.js`)](#44-standalone-share-card-serversrcroutessharejs)
5. [Points Tallies & Counters Restoration](#5-points-tallies--counters-restoration)
   - [5.1 Nominee Card Points (`client/src/components/NomineeCard.jsx`)](#51-nominee-card-points-clientsrccomponentsnomineecardjsx)
   - [5.2 Profile Points Box (`client/src/pages/NomineeProfile.jsx`)](#52-profile-points-box-clientsrcpagesnomineeprofilejsx)
   - [5.3 Leaderboard Table (`client/src/components/LeaderboardTable.jsx`)](#53-leaderboard-table-clientsrccomponentsleaderboardtablejsx)
   - [5.4 Stats Bar Total Votes (`client/src/components/StatsBar.jsx`)](#54-stats-bar-total-votes-clientsrccomponentsstatsbarjsx)
   - [5.5 Results Page (`client/src/pages/Results.jsx`)](#55-results-page-clientsrcpagesresultsjsx)
6. [Summary Checklist for Restoring Voting](#6-summary-checklist-for-restoring-voting)

---

## 1. Overview of What Is Currently Hidden

| Component / Feature | Current State (Nominations Phase) | Target State (Voting Phase) | File(s) |
|---|---|---|---|
| **Results Tab** | Hidden from Navbar & Footer. `/results` maps to `<SuccessfulNominations />`. | Restore `Results` tab (`/results`) pointing to `<Results />`. | `Navbar.jsx`, `Footer.jsx`, `App.jsx` |
| **Nominees Tab** | Commented out in Navbar & Footer. | Uncomment `Nominees` (`/nominees`) in Navbar and Footer. | `Navbar.jsx`, `Footer.jsx` |
| **Podium Section** | Top 3 podium grid hidden; all approved nominees shown in standard list. | Uncomment `<section className="top-nominees-podium-section">` with 1st/2nd/3rd cards. | `TopNominees.jsx` |
| **"Vote Now" Buttons** | Replaced with `"Voting Commencing Soon"` badges. | Re-enable active M-Pesa vote buttons and modals. | `NomineeCard.jsx`, `NomineeProfile.jsx`, `LandingSearchBar.jsx`, `share.js` |
| **Points Tallies** | Hidden from cards, profile heroes, and leaderboards. | Re-enable numeric vote/point counters (`{(nominee.total_points).toLocaleString()} pts`). | `NomineeCard.jsx`, `NomineeProfile.jsx`, `LeaderboardTable.jsx`, `TopNominees.jsx`, `share.js` |
| **Stats Bar Total Votes** | Commented out; shows `"Active Nominations Phase"`. | Uncomment `"Total Votes"` counter. | `StatsBar.jsx` |

---

## 2. Navigation & Routing Restoration

### 2.1 Navbar (`client/src/components/Navbar.jsx`)
In `client/src/components/Navbar.jsx` around lines 169–195:

#### To Restore:
1. Uncomment the `Nominees` navigation link.
2. Change `Successful Nominations` back to `Results` (or keep both if desired).

```jsx
          <li>
            <NavLink
              to="/"
              end
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-home-link"
            >
              Home
            </NavLink>
          </li>
          {/* RESTORED NOMINEES LINK */}
          <li>
            <NavLink
              to="/nominees"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-nominees-link"
            >
              Nominees
            </NavLink>
          </li>
          {/* RESTORED RESULTS LINK */}
          <li>
            <NavLink
              to="/results"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-results-link"
            >
              Results
            </NavLink>
          </li>
          {/* OPTIONAL: You can keep Successful Nominations or remove it */}
          <li>
            <NavLink
              to="/nominate"
              className="navbar-cta"
              onClick={() => {
                setOpen(false);
                setSearchOpen(false);
              }}
              id="navbar-nominate-btn"
            >
              Nominate
            </NavLink>
          </li>
```

---

### 2.2 Footer (`client/src/components/Footer.jsx`)
In `client/src/components/Footer.jsx` around lines 45–60:

#### To Restore:
Uncomment the Top Nominees link and restore the Live Results link:

```jsx
            <ul className="footer-col-links">
              <li>
                <Link to="/">Home & Categories</Link>
              </li>
              <li>
                <Link to="/nominees">
                  <Trophy size={13} className="inline-icon" /> Top Nominees
                </Link>
              </li>
              <li>
                <Link to="/nominate">Submit a Nomination</Link>
              </li>
              <li>
                <Link to="/results">Live Results & Tallies</Link>
              </li>
            </ul>
```

---

### 2.3 App Routes (`client/src/App.jsx`)
In `client/src/App.jsx` around line 27–30:

#### To Restore:
Ensure `Results` renders the original `<Results />` component:

```jsx
          <Route path="/nominees" element={<TopNominees />} />
          <Route path="/nominees/:id" element={<NomineeProfile />} />
          <Route path="/successful-nominations" element={<SuccessfulNominations />} />
          <Route path="/results" element={<Results />} />
```

---

## 3. Podium & Rankings Restoration

### 3.1 Top Nominees & Podium (`client/src/pages/TopNominees.jsx`)
In `client/src/pages/TopNominees.jsx` around lines 155–185:

#### Current State:
```jsx
        {!loading && !error && nominees.length > 0 && (
          <>
            {/* Podium section hidden during nomination phase */}
            {/* {podium.length > 0 && (
              <section className="top-nominees-podium-section">
                <h2 className="section-label">
                  <Trophy size={18} /> Podium
                </h2>
                <div className="top-nominees-podium-grid">
                  {podium.map((nom, i) => (
                    <PodiumCard key={nom.id} nominee={nom} rank={i} />
                  ))}
                </div>
              </section>
            )} */}

            {nominees.length > 0 && (
              <section className="top-nominees-list-section">
                <h2 className="section-label">
                  <Medal size={18} /> Nominees
                </h2>
                <div className="top-nominees-list">
                  {nominees.map((nom, i) => (
                    <NomineeRow key={nom.id} nominee={nom} rank={i + 1} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
```

#### To Restore:
Uncomment the podium section and return the list to render `rest` (nominees from rank 4 downwards):

```jsx
        {!loading && !error && nominees.length > 0 && (
          <>
            {podium.length > 0 && (
              <section className="top-nominees-podium-section">
                <h2 className="section-label">
                  <Trophy size={18} /> Podium
                </h2>
                <div className="top-nominees-podium-grid">
                  {podium.map((nom, i) => (
                    <PodiumCard key={nom.id} nominee={nom} rank={i} />
                  ))}
                </div>
              </section>
            )}

            {rest.length > 0 && (
              <section className="top-nominees-list-section">
                <h2 className="section-label">
                  <Medal size={18} /> Full Rankings
                </h2>
                <div className="top-nominees-list">
                  {rest.map((nom, i) => (
                    <NomineeRow key={nom.id} nominee={nom} rank={i + 4} />
                  ))}
                </div>
              </section>
            )}
          </>
        )}
```

Also in `TopNominees.jsx`:
- In `PodiumCard`: Replace `<div className="podium-status-pill"><span>Voting Commencing Soon</span></div>` with the uncommented `<div className="podium-points-pill">`.
- In `NomineeRow`: Replace `<div className="nominee-row-soon">` with the uncommented `<div className="nominee-row-points">`.

---

## 4. Voting Buttons Restoration

### 4.1 Nominee Card (`client/src/components/NomineeCard.jsx`)
Around lines 44–65:

#### To Restore:
Swap the `"Voting Commencing Soon"` badge back for the active Vote button:

```jsx
      {/* Restored Vote Button */}
      {onVote && (
        <div className="nominee-card-vote">
          <button
            className="btn btn-gold btn-sm nominee-vote-btn"
            onClick={() => onVote(nominee)}
            id={`vote-btn-${nominee.id}`}
          >
            <Trophy size={13} />
            Vote
          </button>
        </div>
      )}
```

---

### 4.2 Nominee Profile (`client/src/pages/NomineeProfile.jsx`)
Around lines 225–245:

#### To Restore:
Swap the `<div className="voting-commencing-banner">` back for the active `Vote for [Name]` button:

```jsx
      <button
        className="btn btn-gold"
        onClick={() => setShowVoteModal(true)}
        id="profile-vote-btn"
      >
        Vote for {nominee.name.split(' ')[0]}
      </button>
```

---

### 4.3 Landing Search Bar (`client/src/components/LandingSearchBar.jsx`)
Around lines 280–300:

#### To Restore:
Swap the `<span className="landing-search-soon-badge">` back for the dropdown quick vote button:

```jsx
      {onVote && (
        <button
          type="button"
          className="btn btn-gold btn-sm landing-search-vote-btn"
          onClick={(e) => {
            e.stopPropagation();
            setIsOpen(false);
            onVote(nom);
          }}
          title={`Vote for ${nom.name}`}
        >
          <Trophy size={13} /> Vote
        </button>
      )}
```

---

### 4.4 Standalone Share Card (`server/src/routes/share.js`)
Around lines 525–552:

#### To Restore:
Uncomment the direct M-Pesa vote package grid and submit button, and remove `<div className="voting-soon-card-banner">`:

```html
    <!-- Direct M-Pesa Voting Form -->
    <div class="vote-box">
      <span class="pkg-label">Select Votes</span>
      <div class="pkg-grid">
        <button type="button" class="pkg-btn active" data-amount="10" data-votes="10">10 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 10</span></button>
        <button type="button" class="pkg-btn" data-amount="20" data-votes="20">20 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 20</span></button>
        <button type="button" class="pkg-btn" data-amount="50" data-votes="50">50 Votes<br><span style="font-size: 0.72rem; opacity: 0.7;">KES 50</span></button>
      </div>

      <span class="pkg-label">M-Pesa Phone Number</span>
      <input type="tel" id="voter-phone" class="phone-input" placeholder="07XXXXXXXX or 01XXXXXXXX" />

      <button type="button" id="vote-btn" class="vote-submit-btn">
        Pay KES 10 & Vote for ${escapeHtml(nomineeFirstName)}
      </button>

      <div id="vote-status" class="status-msg status-info" style="display: none;"></div>
    </div>
```

---

## 5. Points Tallies & Counters Restoration

### 5.1 Nominee Card Points (`client/src/components/NomineeCard.jsx`)
Around lines 33–42:

#### To Restore:
Uncomment the points display in the card body:
```jsx
          <div className="nominee-card-points">
            <div>
              <span className="points-label">Points</span>
            </div>
            <span className="points-value">
              {(nominee.total_points || 0).toLocaleString()}
            </span>
          </div>
```

---

### 5.2 Profile Points Box (`client/src/pages/NomineeProfile.jsx`)
Around lines 217–227:

#### To Restore:
Uncomment the points pill next to candidate metadata:
```jsx
          <div className="profile-points-box">
            <Trophy size={24} />
            <div>
              <span className="points-num">
                {(nominee.total_points || 0).toLocaleString()}
              </span>
              <span style={{ fontSize: '0.8rem', opacity: 0.7 }}>points</span>
            </div>
          </div>
```

---

### 5.3 Leaderboard Table (`client/src/components/LeaderboardTable.jsx`)
Around lines 30–35 and 80–105:

#### To Restore:
1. In table header:
```jsx
            <th style={{ width: '60px', textAlign: 'center' }}>Pos</th>
            <th>Nominee</th>
            <th style={{ textAlign: 'right' }}>Points</th>
            {onVote && <th style={{ width: '100px', textAlign: 'center' }}>Vote</th>}
```
2. In table body row:
```jsx
            <td className="points-cell">
              {(nominee.total_points || 0).toLocaleString()}
            </td>
            {onVote && (
              <td style={{ textAlign: 'center' }}>
                <button
                  className="btn btn-gold btn-sm leaderboard-vote-btn"
                  onClick={() => onVote(nominee)}
                  id={`lb-vote-btn-${nominee.id}`}
                >
                  <Trophy size={12} />
                  Vote
                </button>
              </td>
            )}
```

---

### 5.4 Stats Bar Total Votes (`client/src/components/StatsBar.jsx`)
Around lines 14–23:

#### To Restore:
Uncomment the total votes metric box:
```jsx
          <div className="stat-item">
            <span className="stat-number">{votesCount.toLocaleString()}</span>
            <span className="stat-label">Total Votes</span>
          </div>
```

---

### 5.5 Results Page (`client/src/pages/Results.jsx`)
Around lines 112–118:

#### To Restore:
Replace the status pill with the top winner's points counter:
```jsx
                <div className="top-nominee-points">
                  <Trophy size={14} />
                  <span>{(topNominee.total_points ?? 0).toLocaleString()} pts</span>
                </div>
```

---

## 6. Summary Checklist for Restoring Voting

When you are ready to open voting:
- [ ] **Step 1:** Uncomment the `Nominees` and `Results` links in [`client/src/components/Navbar.jsx`](client/src/components/Navbar.jsx).
- [ ] **Step 2:** Point `/results` route back to `<Results />` in [`client/src/App.jsx`](client/src/App.jsx).
- [ ] **Step 3:** Uncomment `Top Nominees` and `Live Results` links in [`client/src/components/Footer.jsx`](client/src/components/Footer.jsx).
- [ ] **Step 4:** Uncomment the podium section in [`client/src/pages/TopNominees.jsx`](client/src/pages/TopNominees.jsx).
- [ ] **Step 5:** Restore vote buttons in [`client/src/components/NomineeCard.jsx`](client/src/components/NomineeCard.jsx), [`client/src/pages/NomineeProfile.jsx`](client/src/pages/NomineeProfile.jsx), and [`client/src/components/LandingSearchBar.jsx`](client/src/components/LandingSearchBar.jsx).
- [ ] **Step 6:** Uncomment points displays across cards, tables, and profiles.
- [ ] **Step 7:** Run `npm run build` in `client/` to verify that everything compiles cleanly.

---

## 7. Voting Countdown Sticky Bar & `.env` Date Configuration

### 7.1 How to Change the Countdown Date in `.env`
The voting date is configured via environment variables:

- **In `client/.env` (and `client/.env.example`):**
  ```env
  # Target date/time when voting officially commences (ISO-8601 format)
  VITE_VOTING_START_DATE=2026-10-07T00:00:00+03:00
  ```
- **In `server/.env` (and `server/.env.example`):**
  ```env
  VOTING_START_DATE=2026-10-07T00:00:00+03:00
  ```

> [!TIP]
> You can set this to any valid ISO date/time string (e.g. `2026-10-07T00:00:00+03:00` or `2026-11-01T00:00:00+03:00`). The countdown dynamically calculates remaining **Days**, **Hours**, **Minutes**, and **Seconds** in real-time.

### 7.2 Countdown Behavior
- **While Countdown is Active (`diff > 0`)**:
  - Displays: Vibrant red sticky bar with *"Voting Commences In"*, ticking Days, Hours, Minutes, Seconds.
  - Quick CTA to *"Nominate"* and view *"Approved"* candidates.
  - Can be minimized/expanded via the chevron toggle button.
  - Automatically hidden on `/admin` so it does not obstruct administrative workflows.
- **When Countdown Finishes (`diff <= 0`)**:
  - **Disappears completely from the UI**: The component returns `null`, removing both the sticky bar and the bottom spacer div from the DOM so no UI clutter remains once voting is underway.

