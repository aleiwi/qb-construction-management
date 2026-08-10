import asyncio
from app.core.database import AsyncSessionLocal, engine, Base
from app.models.user import User, UserRole
from app.core.security import get_password_hash
from sqlalchemy.future import select

async def main():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).filter(User.email == "admin@qb.com"))
        admin = result.scalars().first()
        if not admin:
            print("Admin user not found. Creating admin@qb.com ...")
            admin_user = User(
                email="admin@qb.com",
                full_name="مدير النظام الرئيسي",
                hashed_password=get_password_hash("admin123"),
                role=UserRole.ADMIN,
                is_active=True
            )
            session.add(admin_user)
            await session.commit()
            print("Admin user created successfully!")
        else:
            print(f"Admin user exists: ID={admin.id}, Email={admin.email}, Role={admin.role}, Active={admin.is_active}")

        all_users = await session.execute(select(User))
        users = all_users.scalars().all()
        print(f"Total users in DB: {len(users)}")
        for u in users:
            print(f" - {u.id}: {u.email} ({u.role})")

if __name__ == "__main__":
    asyncio.run(main())
