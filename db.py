import os
from datetime import datetime
from typing import List, Dict, Any, Optional

from sqlalchemy import (
    create_engine, Column, Integer, String, Text, DateTime, JSON,
    select, update, text
)
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from dotenv import load_dotenv

load_dotenv()

# CONFIGURATION
DATABASE_URL = os.getenv("DATABASE_URL")

# DATABASE SETUP
Base = declarative_base()

class ChatHistory(Base):
    __tablename__ = 'chat_history'

    id = Column(Integer, primary_key=True, index=True)
    session_id = Column(String, index=True, nullable=False)
    timestamp = Column(DateTime, default=datetime.utcnow)
    user_query = Column(Text, nullable=False)
    llm_response = Column(Text, nullable=False)
    sources = Column(JSON, nullable=True)
    context_chunks = Column(JSON, nullable=True) 

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "session_id": self.session_id,
            "timestamp": self.timestamp.isoformat(),
            "user_query": self.user_query,
            "llm_response": self.llm_response,
            "sources": self.sources,
            "context_chunks": self.context_chunks,
        }

# ASYNC ENGINE AND SESSION
async_engine = create_async_engine(
    DATABASE_URL, 
    echo=False, 
    pool_size=10, 
    max_overflow=20
)

AsyncSessionLocal = sessionmaker(
    bind=async_engine, 
    class_=AsyncSession, 
    expire_on_commit=False
)

# UTILITY FUNCTIONS
async def create_db_and_tables():
    """Initializes the database and creates tables if they don't exist."""
    print("🐘 Initializing database and ensuring tables exist...")
    try:
        async with async_engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("✅ Database tables created/ensured.")
    except Exception as e:
        print(f"❌ FATAL: Could not connect to or initialize PostgreSQL. Detail: {e}")

async def save_chat_entry(
    session_id: str,
    user_query: str,
    llm_response: str,
    sources: List[str],
    context_chunks: List[str],
):
    """Saves a single turn of the conversation to the database."""
    async with AsyncSessionLocal() as session:
        new_entry = ChatHistory(
            session_id=session_id,
            user_query=user_query,
            llm_response=llm_response,
            sources=sources,
            context_chunks=context_chunks,
        )
        session.add(new_entry)
        await session.commit()
        await session.refresh(new_entry)
        return new_entry.to_dict()

async def get_chat_history(session_id: str, limit: int = 5) -> List[Dict[str, Any]]:
    """
    Loads the most recent conversation history for a given session_id.
    """
    async with AsyncSessionLocal() as session:
        count_stmt = select(ChatHistory).where(ChatHistory.session_id == session_id)
        total_records = (await session.execute(count_stmt)).scalars().all()
        
        offset = max(0, len(total_records) - limit)

        stmt = (
            select(ChatHistory)
            .where(ChatHistory.session_id == session_id)
            .order_by(ChatHistory.timestamp.asc()) 
            .offset(offset)
            .limit(limit)
        )
        
        result = await session.execute(stmt)
        history_records = result.scalars().all()
        
        return [record.to_dict() for record in history_records]