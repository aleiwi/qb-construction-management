from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from app.models.contract import Contract
from app.models.stage import Stage


class PaymentCalculationService:

    @staticmethod
    async def calculate_stage_payment(
        db: AsyncSession, contract_id: int, stage_id: int
    ) -> Tuple[float, float, float]:
        contract_result = await db.execute(select(Contract).filter(Contract.id == contract_id))
        contract = contract_result.scalars().first()
        if not contract:
            raise ValueError(f"Contract {contract_id} not found")

        stage_result = await db.execute(select(Stage).filter(Stage.id == stage_id))
        stage = stage_result.scalars().first()
        if not stage:
            raise ValueError(f"Stage {stage_id} not found")

        stage_weight = float(stage.weight_percent) / 100.0
        contract_value = float(contract.total_value)

        gross_amount = contract_value * stage_weight
        retention = gross_amount * (float(contract.retention_percent) / 100.0)
        net_amount = gross_amount - retention

        return round(gross_amount, 2), round(net_amount, 2), round(retention, 2)


class PaymentService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_by_id(self, payment_id: int):
        from app.models.payment import Payment
        result = await self.db.execute(select(Payment).filter(Payment.id == payment_id))
        return result.scalars().first()

    async def get_by_contract(self, contract_id: int):
        from app.models.payment import Payment
        result = await self.db.execute(
            select(Payment)
            .filter(Payment.contract_id == contract_id)
            .order_by(Payment.created_at.desc())
        )
        return result.scalars().all()

    async def get_all(self, skip: int = 0, limit: int = 50):
        from app.models.payment import Payment
        result = await self.db.execute(
            select(Payment)
            .offset(skip)
            .limit(limit)
            .order_by(Payment.created_at.desc())
        )
        return result.scalars().all()

    async def get_all_with_names(self, skip: int = 0, limit: int = 50):
        from app.models.payment import Payment
        from app.models.contract import Contract
        from app.models.stage import Stage
        query = (
            select(Payment, Contract.title.label("contract_title"), Stage.name.label("stage_name"))
            .join(Contract, Payment.contract_id == Contract.id)
            .join(Stage, Payment.stage_id == Stage.id)
            .offset(skip)
            .limit(limit)
            .order_by(Payment.created_at.desc())
        )
        result = await self.db.execute(query)
        return result.all()

    async def create(self, contract_id: int, stage_id: int, notes: str = None) -> dict:
        from app.models.payment import Payment
        gross, net, retention = await PaymentCalculationService.calculate_stage_payment(
            self.db, contract_id, stage_id
        )
        payment = Payment(
            contract_id=contract_id,
            stage_id=stage_id,
            amount=gross,
            retention_amount=retention,
            net_amount=net,
            notes=notes,
        )
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        return payment

    async def approve(self, payment, user_id: int) -> dict:
        from app.models.payment import PaymentStatus
        from app.services.quality_check_service import QualityCheckService
        qc_service = QualityCheckService(self.db)
        has_passed = await qc_service.stage_has_passed_qc(payment.stage_id)
        if not has_passed:
            raise ValueError("لا يمكن اعتماد الدفعة إلا بعد اجتياز فحص الجودة للمرحلة المعنية")
        old_status = payment.status
        payment.status = PaymentStatus.APPROVED
        payment.approved_by = user_id
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        await self._audit(user_id, "payment.approve", "payment", payment.id,
                          old_value={"status": str(old_status)},
                          new_value={"status": str(payment.status),
                                     "amount": float(payment.amount),
                                     "net_amount": float(payment.net_amount)})
        return payment

    async def mark_paid(self, payment, user_id: int) -> dict:
        from app.models.payment import PaymentStatus
        from datetime import datetime
        old_status = payment.status
        payment.status = PaymentStatus.PAID
        payment.paid_at = datetime.utcnow()
        payment.approved_by = user_id
        self.db.add(payment)
        await self.db.commit()
        await self.db.refresh(payment)
        await self._audit(user_id, "payment.mark_paid", "payment", payment.id,
                          old_value={"status": str(old_status)},
                          new_value={"status": str(payment.status),
                                     "paid_at": str(payment.paid_at),
                                     "net_amount": float(payment.net_amount)})
        return payment

    async def _audit(self, user_id: int, action: str, entity_type: str, entity_id: int,
                     old_value=None, new_value=None) -> None:
        from app.services.audit_log_service import AuditLogService
        audit = AuditLogService(self.db)
        await audit.log(user_id, action, entity_type, entity_id, old_value, new_value)

    async def delete(self, payment_id: int) -> bool:
        from app.models.payment import Payment
        payment = await self.get_by_id(payment_id)
        if not payment:
            return False
        await self.db.delete(payment)
        await self.db.commit()
        return True

    async def get_pending_total(self) -> float:
        from app.models.payment import Payment, PaymentStatus
        from sqlalchemy import func
        result = await self.db.execute(
            select(func.coalesce(func.sum(Payment.net_amount), 0))
            .filter(Payment.status == PaymentStatus.PENDING)
        )
        return float(result.scalar() or 0)