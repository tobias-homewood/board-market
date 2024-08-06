from google.cloud import storage
import uuid

def upload_blob(file_object, destination_blob_name=None):
    """Uploads a file to the bucket."""
    bucket_name = "board-market"  # Update with your bucket name
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)

    # If destination_blob_name is empty, generate a unique name using a UUID
    if not destination_blob_name:
        destination_blob_name = str(uuid.uuid4())

    blob = bucket.blob(destination_blob_name)

    blob.upload_from_file(file_object)


def download_blob(source_blob_name, destination_file_name):
    """Downloads a blob from the bucket."""
    bucket_name = "board-market"  
    storage_client = storage.Client()
    bucket = storage_client.bucket(bucket_name)
    blob = bucket.blob(source_blob_name)

    blob.download_to_filename(destination_file_name)
