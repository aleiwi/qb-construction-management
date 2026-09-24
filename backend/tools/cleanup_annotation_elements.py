"""One-off cleanup: delete annotation-layer junk BOQElements (ج10).

The extractor no longer creates elements for annotation/dimension layers, but
drawings processed BEFORE the fix still hold them (e.g. 96k S-DIMENSION rows).
This script deletes, per drawing, UNCLASSIFIED elements on annotation layers
that have no BOQItem (priced) rows, then recomputes the drawing counters.

SAFETY:
  - --db-url is REQUIRED (no default — never guess which database to touch).
  - Dry-run by default; pass --apply to actually delete.
  - Never touches classified elements or anything linked to a BOQItem.

Usage (PowerShell, from backend/):
  .venv/Scripts/python tools/cleanup_annotation_elements.py --db-url "sqlite+aiosqlite:///./qb_dev.db"
  .venv/Scripts/python tools/cleanup_annotation_elements.py --db-url "..." --apply
"""
import argparse
import asyncio
import sys

sys.path.insert(0, ".")

from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, delete

from app.core.database import Base  # noqa: F401  (model registration)
# Import every model so SQLAlchemy relationship mappers resolve.
from app.models import (  # noqa: F401,F403
    user, project, building, stage, contractor, contract, drawing,
    batch_job, boq_element, price_library, boq_item, payment,
    retention_release, quality_check, employee, completion_report,
    audit_log, user_project, boq_project, classification_training,
    oauth_account,
)
from app.models.boq_element import BOQElement, ClassificationStatus
from app.models.boq_item import BOQItem
from app.models.drawing import Drawing
from app.services.boq_extraction_service import _is_annotation_layer

CHUNK = 2000


async def main() -> None:
    ap = argparse.ArgumentParser(description="Delete annotation-layer junk BOQ elements.")
    ap.add_argument("--db-url", required=True, help="SQLAlchemy async DB URL (explicit, no default).")
    ap.add_argument("--apply", action="store_true", help="Actually delete (default: dry-run).")
    args = ap.parse_args()

    engine = create_async_engine(args.db_url, echo=False, future=True)
    Session = async_sessionmaker(bind=engine, class_=AsyncSession, expire_on_commit=False)

    async with Session() as db:
        # Candidate layers among unclassified elements.
        layers = (
            await db.execute(
                select(BOQElement.source_layer_name)
                .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
                .distinct()
            )
        ).scalars().all()
        junk_layers = sorted({l for l in layers if _is_annotation_layer(l or "")})
        if not junk_layers:
            print("No annotation layers with unclassified elements. Nothing to do.")
            return

        # Priced element ids must never be deleted (extra guard).
        priced = set(
            (await db.execute(select(BOQItem.boq_element_id))).scalars().all()
        )

        total = 0
        affected_drawings: set = set()
        for layer in junk_layers:
            q = (
                select(BOQElement.id, BOQElement.drawing_id)
                .filter(
                    BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED,
                    BOQElement.source_layer_name == layer,
                )
                .order_by(BOQElement.id)
            )
            offset = 0
            while True:
                rows = (await db.execute(q.offset(offset).limit(CHUNK))).all()
                if not rows:
                    break
                ids = [r[0] for r in rows if r[0] not in priced]
                for r in rows:
                    if r[0] not in priced:
                        affected_drawings.add(r[1])
                if args.apply and ids:
                    for i in range(0, len(ids), 500):
                        await db.execute(
                            delete(BOQElement).filter(BOQElement.id.in_(ids[i:i + 500]))
                        )
                total += len(ids)
                if len(rows) < CHUNK:
                    break
                # NOTE: offset-based paging while deleting shifts rows; re-query
                # from 0 after each applied chunk for correctness.
                if args.apply:
                    offset = 0
                else:
                    offset += CHUNK

        print(f"Annotation layers: {junk_layers}")
        print(f"Junk unclassified elements (no BOQItem): {total}")
        print(f"Affected drawings: {sorted(affected_drawings)}")

        if args.apply:
            for did in sorted(affected_drawings):
                tot = await db.execute(
                    select(func.count(BOQElement.id)).filter(BOQElement.drawing_id == did)
                )
                un = await db.execute(
                    select(func.count(BOQElement.id))
                    .filter(BOQElement.drawing_id == did)
                    .filter(BOQElement.classification_status == ClassificationStatus.UNCLASSIFIED)
                )
                cl = await db.execute(
                    select(func.count(BOQElement.id))
                    .filter(BOQElement.drawing_id == did)
                    .filter(BOQElement.classification_status != ClassificationStatus.UNCLASSIFIED)
                )
                d = await db.get(Drawing, did)
                if d:
                    d.elements_count = tot.scalar() or 0
                    d.unclassified_count = un.scalar() or 0
                    d.classified_count = cl.scalar() or 0
                    db.add(d)
            await db.commit()
            print(f"Deleted {total} elements and recomputed {len(affected_drawings)} drawings.")
        else:
            print("Dry-run: nothing deleted. Re-run with --apply to execute.")

    await engine.dispose()


if __name__ == "__main__":
    asyncio.run(main())
