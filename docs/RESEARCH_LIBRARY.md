# RESEARCH_LIBRARY.md — Construction ERP Knowledge Base

**Date:** 2026-08-10
**Scope:** Phase 1-3 research synthesis (platforms, standards, KSA market, AI, document control). Every entry follows the required SOURCE / AUTHOR-ORG / YEAR / DOMAIN / AUTHORITY LEVEL / KEY INSIGHTS / APPLICATION / SOURCE URL format. Claims that could not be verified against primary sources are explicitly flagged ⚠️.

---

## 1. CONSTRUCTION ERP / PM PLATFORMS (Phase 1-A)

### Procore
- **SOURCE/AUTHOR:** Procore (official site + support docs) | **YEAR:** 2025-2026 | **DOMAIN:** Construction PM/Financials/Quality | **AUTHORITY:** T1 (vendor docs)
- **KEY INSIGHTS:** Three pillars: Project Management (drawings, submittals, RFIs, transmittals, meetings, schedule), Construction Financials (budget, prime contract, commitments, **change-event→CO tiering**: PCO→CCO/OCO with budget-code linkage), Quality & Safety (Daily Log, Inspections, Observations with 5-type taxonomy, Punch List, Incidents). Permission model: company/project level, per-tool granularity, "Ball in Court" RFI ownership. Reports: Project Mgmt, Quality & Safety analytics.
- **APPLICATION:** Change-order tiering + budget-code linkage = model for our change module; Observations taxonomy → QC module; RFI ownership model → future RFI module.
- **URL:** procore.com/quality-safety, support.procore.com (RFI/Submittals guides)

### Autodesk Construction Cloud (Forma: Build, Docs, Takeoff)
- **SOURCE/AUTHOR:** Autodesk (official/help/release timeline) | **YEAR:** 2021-2026 | **DOMAIN:** CDE + PM + Takeoff | **AUTHORITY:** T1
- **KEY INSIGHTS:** Docs = Common Data Environment with ISO 19650 naming validation + versioned workflows; Build = RFIs, Submittals (custom review workflows), Daily Logs, Issues/punch lists, Inspections, Safety, Schedule (version comparison), Assets, Specifications, Cost Management (custom budget structures, SOV, incremental pay apps, **lien/insurance compliance gates blocking payment**, eSignature); Takeoff = 2D sheet + 3D quantification, symbol detection; Pype AutoSpecs = AI submittal-log generation.
- **APPLICATION:** Compliance gates before payment = upgrade path for our payment approvals; revision-aware takeoff = our BOQ-from-drawing pipeline.
- **URL:** construction.autodesk.com/workflows/construction-cost-management/

### RIB (CostX, CX, BuildSmart)
- **SOURCE/AUTHOR:** RIB (official) | **YEAR:** 2024-2026 | **DOMAIN:** QS takeoff + cost ERP | **AUTHORITY:** T1
- **KEY INSIGHTS:** CostX: 2D (PDF/CAD) + BIM 3D takeoff, live-linked rate workbooks, **auto-revision tool** (drawing compare → quantity/cost delta), WBS, report writer. CX: ITP-based Quality Management (inspection/test plan → work lots → checklists → evidence), Defects mgmt with photos, Commercial Manager procure-to-pay. BuildSmart: enterprise cost/accounting **"approved for use by tax authorities in Saudi Arabia"** (also HMRC UK).
- **APPLICATION:** ITP→checklist→evidence = our QC upgrade template; KSA tax-approved module = competitive evidence for ZATCA-readiness work.
- **URL:** rib-software.com

### Trimble Viewpoint Vista + ProjectSight
- **SOURCE/AUTHOR:** Trimble (official help) | **YEAR:** 2026 | **DOMAIN:** Contractor ERP + PM | **AUTHORITY:** T1
- **KEY INSIGHTS:** Vista core = **Job Cost model: Jobs/Phases/Cost Types**; commitments + actuals accumulate by job-phase-cost-type; WIP, retainage, AIA billing, payroll, equipment charged to jobs, Job Level Security. ProjectSight: Drawings (version control, markup→RFI), RFIs (reviewers, due dates, email-linked replies), Daily Reports, Issues, BIM viewing. Dominant market pattern: **Procore+Vista best-of-breed pair**.
- **APPLICATION:** Jobs/Phases/Cost-Types = canonical cost-code structure for our cost module; Job Level Security = project-scoped RBAC target.
- **URL:** viewpoint.com/products/vista, help.trimble.com (Job Cost)

### Buildertrend / CoConstruct (SMB)
- **SOURCE/AUTHOR:** Buildertrend/CoConstruct (official) | **YEAR:** 2024-2026 | **DOMAIN:** SMB portal-first PM | **AUTHORITY:** T1
- **KEY INSIGHTS:** Client/subcontractor portals; selections/specs; single-entry estimate→budget→proposal→change-order baseline; WIP reports (over/under-billing); AI bill capture; QuickBooks/Xero two-way sync. CoConstruct Baseline View = original schedule vs actual (schedule variance).
- **APPLICATION:** Portal-first UX for owner collaboration; WIP over/under-billing report = our payment reporting target.
- **URL:** buildertrend.com, coconstruct.com

### Fieldwire / Revizto (field)
- **SOURCE/AUTHOR:** Hilti Fieldwire, Revizto (official) | **YEAR:** 2024-2026 | **DOMAIN:** Field tasks/issues/markups | **AUTHORITY:** T1
- **KEY INSIGHTS:** Fieldwire: tasks/punch lists pinned to plan locations, offline-first, sheet compare; Revizto: 2D/3D issue management, stamp templates, **issue automations**, audit trail to resolution, CDE integrations.
- **APPLICATION:** Location-pinned field tasks = future field module; our drawing viewer markup layer could feed issues.
- **URL:** fieldwire.com, revizto.com

### Sage 300 CRE / Jonas
- **SOURCE/AUTHOR:** Sage/Jonas (official + partners) | **YEAR:** 2024-2026 | **DOMAIN:** Contractor accounting | **AUTHORITY:** T2
- **KEY INSIGHTS:** Sage: job costing, GL/AP/AR, native payroll (prevailing wage), AIA billing, equipment mgmt. Jonas: built-in WIP, **retainage/holdback**, AIA/CCDC progress billing, **user-level security + detailed audit trails**, field time → payroll+job-cost single step.
- **APPLICATION:** Retainage integrated in AR = target for our disconnected retention module; audit-trail depth benchmark.
- **URL:** jonasconstruction.com, sage.com

### Oracle Primavera P6 / Primavera Cloud / Aconex
- **SOURCE/AUTHOR:** Oracle (docs) | **YEAR:** 2024-2026 | **DOMAIN:** Scheduling/EVM + document control | **AUTHORITY:** T1
- **KEY INSIGHTS:** P6: CPM, **baseline discipline** (set baselines → designate EV baseline → recalc BAC), **EVM native**: CPI=EV/AC, SPI=EV/PV, SV, CV, EAC variants, ETC, VAC; percent-complete types: Duration/Physical/Units; **0/100 and 50/50 rules**. Aconex: **unalterable project record**, version (system) vs revision (free field), transmittals as chain-of-custody (no approval status), event-log audit trail, ITP test-plan workflows, multi-org data ownership.
- **APPLICATION:** EVM + baseline = our project health module; version/revision semantics + append-only event log = our document/drawing module target.
- **URL:** docs.oracle.com (Earned Value Overview), help.aconex.com

### Takeoff tools (PlanSwift / Bluebeam / CostX)
- **SOURCE/AUTHOR:** vendors (official) | **YEAR:** 2024-2026 | **DOMAIN:** Quantity takeoff | **AUTHORITY:** T1
- **KEY INSIGHTS:** PlanSwift: assemblies auto-calc materials+labor, AI auto-takeoff/count/scale. Bluebeam: **scale calibration**, length/area/volume/count, VisualSearch symbol counting, Dynamic Fill irregular areas, Quantity Link→Excel. CostX: auto-revisioning.
- **APPLICATION:** Scale calibration + symbol counting = mandatory for our quantity engine (currently missing scale handling entirely — audit Q-05).
- **URL:** planswift.com, support.bluebeam.com

---

## 2. QUANTITY SURVEYING STANDARDS (Phase 2)

### RICS NRM 1/2/3
- **SOURCE/AUTHOR:** RICS (official standards) | **YEAR:** 2009-2021 (NRM2 2nd ed. eff. 1 Dec 2021) | **DOMAIN:** Measurement | **AUTHORITY:** T1
- **KEY INSIGHTS:** NRM2 = detailed measurement rules for BQ: item tables (item/unit/description), units m/m²/m³/nr/item, **steel rebar billed in tonnes to 2dp**, provisional sums (defined vs undefined), preliminaries fixed/time-related. NRM1 = cost planning (14 element groups). NRM3 = maintenance.
- **APPLICATION:** Measurement rule-set field per BOQ item (NRM2 section reference) for auditability; unit taxonomy.
- **URL:** rics.org/profession-standards/.../nrm

### ICMS
- **SOURCE/AUTHOR:** ICMS Coalition (RICS, AACE, AIQS, ICE...) | **YEAR:** 2017/2019/2021 | **DOMAIN:** Cost classification | **AUTHORITY:** T1
- **KEY INSIGHTS:** Global cost-classification framework (not measurement rules); ICMS3 adds carbon; links to IPMS floor-area standards.
- **APPLICATION:** Cost-category taxonomy for CBS (cost breakdown structure) naming in budget module.
- **URL:** icms-coalition.org/the-standard/

### CESMM4
- **SOURCE/AUTHOR:** ICE | **YEAR:** 2012/2019 | **DOMAIN:** Civil measurement | **AUTHORITY:** T1
- **KEY INSIGHTS:** 26 work classes, coding/numbering of items, contract-neutral, daywork clauses, method-related charges.
- **APPLICATION:** Item coding scheme precedent for BOQ item codes.
- **URL:** ice.org.uk/areas-of-interest/.../civil-engineering-standard-measurement

### Rate analysis
- **SOURCE/AUTHOR:** Autodesk Blog, CPWD, industry practice | **YEAR:** 2025-2026 | **DOMAIN:** Estimating | **AUTHORITY:** T2/T3
- **KEY INSIGHTS:** Unit rate = materials (+wastage 2-2.5%) + labour (crew×productivity×wage) + plant + overheads (5-13%) + profit (8-15%); **no single standard O&P %** — jurisdiction-specific.
- **APPLICATION:** Configurable rate-build-up model (our pricing_engine hardcodes 15/10/5/15% — audit P-05).
- **URL:** autodesk.com/blogs/construction/rate-analysis

### FIDIC Red Book 2017 (Clauses 13 & 14)
- **SOURCE/AUTHOR:** FIDIC + commentary | **YEAR:** 2017-2026 | **DOMAIN:** Contracts/payments | **AUTHORITY:** T1
- **KEY INSIGHTS:** Advance payment ~10% w/ guarantee, repaid via IPC deductions (~25%/IPC); IPC certification 28 days; **retention released 50% at Taking-Over, balance after Defects Period**; variations: contract rates → analogous → fair valuation → daywork; time bars 28/42 days. **Saudi amendments frequently delete 14.8 financing charges** (interest) ⚠️ per Pinsent Masons.
- **APPLICATION:** Payment module: advance-payment repayment schedules, retention release logic, variation valuation routes, per-contract configurable terms.
- **URL:** fidic.uz/en/clauses/payment-14/, fidic.uz/en/clauses/variations-13/

### EVM (PMI PMBOK)
- **SOURCE/AUTHOR:** PMI | **YEAR:** current | **DOMAIN:** Performance measurement | **AUTHORITY:** T1
- **KEY INSIGHTS:** SV=EV−PV; CV=EV−AC; SPI=EV/PV; CPI=EV/AC; EAC=BAC/CPI (typical) | AC+(BAC−EV) (atypical) | AC+(BAC−EV)/(CPI×SPI); ETC=EAC−AC; VAC=BAC−EAC; TCPI=(BAC−EV)/(BAC−AC). Progress methods: physical %, units, milestone weighting, 0/100, 50/50.
- **APPLICATION:** KPI engine formulas with definition/formula/source/unit/frequency/interpretation/owner (Phase 12).
- **URL:** pmi.org/learning/library/earned-value-management-systems-analysis-8026

### Claims/EOT/delay
- **SOURCE/AUTHOR:** FIDIC official, SCL Protocol | **YEAR:** 2004-2017 | **DOMAIN:** Claims | **AUTHORITY:** T1
- **KEY INSIGHTS:** EOT for non-contractor causes; delay analysis per SCL Delay & Disruption Protocol 2nd ed.; LD with cap; strict notice time bars; concurrent-delay nuance.
- **APPLICATION:** Claims module must timestamp notices — audit-trail enabled (our audit logging is the foundation).
- **URL:** fidic.org (Papworth claims paper)

---

## 3. SAUDI ARABIA MARKET (Phase 2)

### ZATCA e-invoicing + construction VAT
- **SOURCE/AUTHOR:** ZATCA official guidelines + PwC/Deloitte | **YEAR:** 2021-2026 | **DOMAIN:** Tax compliance | **AUTHORITY:** T1
- **KEY INSIGHTS:** Phase 2 (Integration) mandatory in waves (B2B cleared via Fatoora; B2C stamped + reported ≤24h); UBL 2.1 XML / PDF/A-3, CSID stamp, QR. **Construction VAT 15% standard-rated at every tier; tax point includes issuance of the completion report and (gov contracts) payment order; VAT due on full invoice INCLUDING retained portion at invoicing — no re-invoicing at release.** Reverse charge for non-resident suppliers on KSA real-estate services. 2026 wave deadlines ⚠️ vendor-reported (verify zatca.gov.sa). Records ≥6 years ⚠️ practice-note source.
- **APPLICATION:** Completion-report approval = VAT trigger date candidate; payment module needs VAT-on-retention handling; e-invoicing is P2/P3 (requires CSID infrastructure).
- **URL:** zatca.gov.sa/en/E-Invoicing/, ZATCA Contracting Sector VAT Guideline (Dec 2021 PDF)

### Saudi construction practice
- **SOURCE/AUTHOR:** Pinsent Masons, Chambers & Partners, Legal 500, DLA Piper | **YEAR:** 2025-2026 | **DOMAIN:** Legal/market | **AUTHORITY:** T1/T2
- **KEY INSIGHTS:** FIDIC 1999 dominant (2017 adopted), heavily amended employer-favourable; **decennial liability 10 yrs** (SBC Regs Art. 29); retention typically 5-10%; no statutory security-of-payment; pay-when-paid common; advance payments w/ guarantees; performance bonds ≥10%. **GOSI: Saudis 22% (12+10) vs new unified system 21.6% (11.85+9.75) ⚠️ cohort-dependent conflict**; expats 2% employer-only; Nitaqat bands; WPS wage-protection files; EOS benefits. SBC 2024 edition mandatory from 30 Jun 2025 ⚠️ Chambers-sourced. Etimad = MoF government e-procurement (tenders, e-bidding, contracts).
- **APPLICATION:** Financial defaults configurable per contract (retention/advance/terms); HR module needs configurable GOSI rates + WPS export (P3).
- **URL:** practiceguides.chambers.com (Construction Law 2026 Saudi Arabia)

---

## 4. ISO STANDARDS (Phase 2)

**Framing (verified):** ISO does not certify software — certification applies to organizations. Defensible product claims: "inspired by / aligned with / supports clause X". **Never claim certification.**

- **ISO 19650 (BIM IM):** CDE states WIP→Shared→Published→Archive; revision codes P/C; status codes S0-S7, A/B/C; naming conventions. APPLICATION: document state machine + revision/status = our document module target. (T1, 2018-2022, iso.org/standard/68078.html)
- **ISO 9001 (Quality):** document control 7.5, NCR + corrective action 10.2, audit 9.2. APPLICATION: QC module → NCR/CAPA workflow. NOTE: 2026 revision in publication (Sept 2026, 3-yr transition). (T1, iso.org/standard/62085.html)
- **ISO 21502 (PM):** practice-based guidance, benefits mgmt. APPLICATION: generic PM modules already align. (T1, iso.org/standard/74947.html)
- **ISO 31000 (Risk):** risk process; **explicitly not certifiable**. APPLICATION: 5×5 risk register module = easiest ISO-alignment win. (T1, iso.org/standard/65694.html)
- **ISO 45001 (Safety):** incidents incl. near-miss 10.2, hazard ID 6.1, competence 7.2. APPLICATION: HSE module strongly aligned. (T1, iso.org/standard/63787.html)
- **ISO 27001 (Security) — MOST SOFTWARE-RELEVANT:** Annex A 93 controls (2022): access control 5.15; **audit logging 8.15 (log integrity: admins must not alter own logs)**; retention 8.10; backup 8.13; secure coding 8.28 (OWASP); security testing 8.29. APPLICATION: append-only tamper-evident audit log = P1 target for our audit module. (T1, iso.org/standard/27001)

---

## 5. AI IN CONSTRUCTION (Phase 1-C)

### AI quantity takeoff
- **SOURCE/AUTHOR:** Easy Takeoffs, AECO.digital, vendor benchmarks (Pilars, Kreo, Togal) | **YEAR:** 2024-2026 | **DOMAIN:** AI takeoff | **AUTHORITY:** T2/T3
- **KEY INSIGHTS:** **All serious tools are AI-assisted with human-in-the-loop — "AI-automated takeoff does not exist for production."** Accuracy ~90-95% clean vector plans, ~80-90% commercial, lower on scanned/MEP ⚠️ vendor figures. Practice: scale verification (1% scale error compounds), confidence-flagged pages → manual review, parallel-manual benchmarks 30-60 days, acceptance tolerance ~3-5% on repetitive elements.
- **APPLICATION:** Our AI classifier already has human-in-the-loop (unclassified queue). Extend: confidence flags, evidence, reviewer decision — per RICS standard below.
- **URL:** easytakeoffs.com/blog/best-ai-takeoff-software

### RICS "Responsible use of AI in surveying practice" (1st global standard)
- **SOURCE/AUTHOR:** RICS official | **YEAR:** 2025 (eff. 9 Mar 2026) | **DOMAIN:** AI governance | **AUTHORITY:** T1
- **KEY INSIGHTS:** Written AI risk register; appropriateness assessment; **professional judgement on every material AI output with named accountable individual**; randomized dip-sampling; client transparency.
- **APPLICATION:** AI quantity provenance tuple: source drawing+revision+issue date + rule set + model version + confidence + reviewer decision + audit trail (audit AI-02 gap).
- **URL:** rics.org (Responsible use of AI standard PDF)

### LLM prompt injection (OWASP LLM Top 10)
- **SOURCE/AUTHOR:** OWASP | **YEAR:** 2025-2026 | **DOMAIN:** AI security | **AUTHORITY:** T1
- **KEY INSIGHTS:** LLM01 Prompt Injection = #1 risk; **indirect injection via documents (RAG poisoning: hostile instructions embedded in contract/drawing text)** is the construction-domain risk; RAG doesn't fully mitigate; mitigations: treat documents as untrusted, denote external content, deterministic validation, citations, human-in-the-loop.
- **APPLICATION:** Our llm_classifier embeds DXF text into prompts (audit AI-05) — needs source separation + output validation.
- **URL:** owasp.org/www-project-top-10-for-large-language-model-applications/

---

## 6. DOCUMENT CONTROL (Phase 1-C)

### Submittals vs transmittals; revisions; RFI lifecycle
- **SOURCE/AUTHOR:** AIA (G716, A201), USACE, Crossrail, ISO 19650 NA, Procore | **YEAR:** 2004-2026 | **DOMAIN:** Document control | **AUTHORITY:** T1
- **KEY INSIGHTS:** **Submittal** = substantive doc for approval; **Transmittal** = chain-of-custody wrapper (no approval status). Approval states: Approved / Approved-as-Noted / Revise-and-Resubmit / Rejected (USACE A/B/C/E). Revision numbering: letters pre-IFC (skip I/O/Q/X) → numbers post-IFC (0,1,2) → as-built next number. Issue codes: IFT (tender), IFC (construction), IFR (review), IFA (approval), IFI (information), AFC; **"IFU" not standard** ⚠️. RFI lifecycle: Draft→Open→In Review→Responded→Returned→Resolved/Closed; **RFIs do not by themselves authorize cost/time changes** (AIA G716).
- **APPLICATION:** Drawing module must support issue codes + revision numbering + submittal/transmittal distinction (P2); RFI module future.
- **URL:** help.aiacontracts.com, learninglegacy.crossrail.co.uk

---

## 7. VERIFICATION FLAGS (re-verify before implementation)
1. ZATCA 2026 wave deadlines — vendor-sourced ⚠️
2. GOSI 2026 rates 22% vs 21.6% — cohort-dependent ⚠️ (must be configurable)
3. "MOLA" standard does not exist — the credible standards are NRM/ICMS/ILMS
4. "IFU" issue code not standard — use IFI/IFR/IFA/IFC/IFT/AFC
5. AI takeoff accuracy figures are vendor self-reported
6. "Project health score"/"cash flow accuracy" have no standard definitions — configurable composites
7. FIDIC payment timelines (28/56 days) are Contract Data defaults — configurable per contract
8. ISO 9001:2026 in publication; ISO/DIS 45001 in ballot
9. KSA amendments often delete FIDIC 14.8 financing charges — don't assume interest accrues
