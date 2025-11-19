import os
import asyncio
import json
import logging
from qdrant_client import QdrantClient, models
from dotenv import load_dotenv

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

load_dotenv()

class QdrantMigrator:
    def __init__(self):
        # Cloud Qdrant configuration (source)
        self.cloud_url = "https://cfff7e68-e8de-4a9c-bddc-47f434253e5c.us-west-1-0.aws.cloud.qdrant.io:6333"
        self.cloud_api_key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.YNToo6cbXc1DCP2hXuj5zpOGBXXhsUPYfieiGGrDUnE"
        
        self.local_url = "http://localhost:6333"
        self.local_api_key = ""  # No API key needed for local instance
        
        # Collection names to migrate
        self.collections = [
            "ncert_multidoc_index9",
            "llm_semantic_cache"
        ]
        
        # Initialize clients
        self.cloud_client = QdrantClient(url=self.cloud_url, api_key=self.cloud_api_key)
        self.local_client = QdrantClient(url=self.local_url, api_key=self.local_api_key)
        
    async def create_backup(self):
        """Create a backup of all collections from Qdrant Cloud"""
        logger.info("Starting backup process from Qdrant Cloud...")
        
        backup_data = {}
        
        for collection_name in self.collections:
            try:
                logger.info(f"Backing up collection: {collection_name}")
                
                # Get collection info
                collection_info = self.cloud_client.get_collection(collection_name)
                
                # Get all records with scrolling
                all_records = []
                offset = None
                limit = 100
                
                while True:
                    records, next_offset = self.cloud_client.scroll(
                        collection_name=collection_name,
                        limit=limit,
                        offset=offset,
                        with_payload=True,
                        with_vectors=True
                    )
                    
                    all_records.extend(records)
                    
                    if next_offset is None:
                        break
                        
                    offset = next_offset
                
                # Store collection data
                # Convert VectorParams to dict for JSON serialization
                vectors_config = None
                if hasattr(collection_info.config.params, 'vectors') and collection_info.config.params.vectors:
                    if hasattr(collection_info.config.params.vectors, 'dict'):
                        vectors_config = collection_info.config.params.vectors.dict()
                    else:
                        # Handle named vectors
                        vectors_config = {}
                        for name, params in collection_info.config.params.vectors.items():
                            vectors_config[name] = {
                                "size": params.size,
                                "distance": params.distance.value
                            }
                
                # Convert Record objects to dictionaries for JSON serialization
                records_data = []
                for record in all_records:
                    record_dict = {
                        "id": record.id,
                        "vector": record.vector,
                        "payload": record.payload
                    }
                    records_data.append(record_dict)
                
                backup_data[collection_name] = {
                    "config": {
                        "vectors": vectors_config,
                        "sparse_vectors": collection_info.config.params.sparse_vectors
                    },
                    "records": records_data
                }
                
                logger.info(f"Backed up {len(all_records)} records from {collection_name}")
                
            except Exception as e:
                logger.error(f"Error backing up collection {collection_name}: {str(e)}")
                continue
        
        # Save backup to file
        with open("qdrant_backup.json", "w") as f:
            json.dump(backup_data, f, indent=2)
            
        logger.info(f"Backup completed. Data saved to qdrant_backup.json")
        return backup_data
    
    async def restore_backup(self, backup_data=None):
        """Restore backup to local Qdrant instance"""
        logger.info("Starting restore process to local Qdrant...")
        
        if backup_data is None:
            # Load backup from file
            try:
                with open("qdrant_backup.json", "r") as f:
                    backup_data = json.load(f)
                logger.info("Loaded backup from qdrant_backup.json")
            except FileNotFoundError:
                logger.error("Backup file not found. Please run backup first.")
                return
        
        for collection_name, collection_data in backup_data.items():
            try:
                logger.info(f"Restoring collection: {collection_name}")
                
                # Check if collection exists
                collections = self.local_client.get_collections()
                exists = any(c.name == collection_name for c in collections.collections)
                
                if not exists:
                    # Create collection with same configuration
                    self.local_client.create_collection(
                        collection_name=collection_name,
                        vectors_config=collection_data["config"]["vectors"]
                    )
                    logger.info(f"Created collection: {collection_name}")
                else:
                    logger.info(f"Collection {collection_name} already exists")
                
                # Prepare records for insertion
                points = []
                for record in collection_data["records"]:
                    # Records are now dictionaries after JSON serialization
                    point = models.PointStruct(
                        id=record["id"],
                        vector=record["vector"],
                        payload=record["payload"]
                    )
                    points.append(point)
                
                # Insert records in batches
                batch_size = 100
                for i in range(0, len(points), batch_size):
                    batch = points[i:i + batch_size]
                    self.local_client.upsert(
                        collection_name=collection_name,
                        points=batch
                    )
                    logger.info(f"Inserted batch {i//batch_size + 1}/{(len(points)-1)//batch_size + 1} for {collection_name}")
                
                logger.info(f"Restored {len(points)} records to {collection_name}")
                
            except Exception as e:
                logger.error(f"Error restoring collection {collection_name}: {str(e)}")
                continue
        
        logger.info("Restore process completed")
    
    async def run_migration(self):
        """Run the complete migration process"""
        logger.info("Starting Qdrant migration process...")
        
        # Step 1: Create backup
        backup_data = await self.create_backup()
        
        # Step 2: Restore backup
        await self.restore_backup(backup_data)
        
        logger.info("Migration process completed successfully")

async def main():
    migrator = QdrantMigrator()
    await migrator.run_migration()

if __name__ == "__main__":
    asyncio.run(main())