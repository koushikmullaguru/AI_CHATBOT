import os
import zipfile

def unzip_all_in_directory(root_dir):
    """
    Recursively finds and extracts all .zip files in a given directory.
    Each zip file is extracted into the same folder where it's located.
    """
    for foldername, subfolders, filenames in os.walk(root_dir):
        for filename in filenames:
            if filename.lower().endswith('.zip'):
                zip_path = os.path.join(foldername, filename)
                extract_dir = foldername  # same folder

                print(f"Extracting: {zip_path} -> {extract_dir}")

                try:
                    with zipfile.ZipFile(zip_path, 'r') as zip_ref:
                        zip_ref.extractall(extract_dir)
                    print(f"✅ Extracted: {zip_path}")
                except zipfile.BadZipFile:
                    print(f"❌ Skipped (bad zip): {zip_path}")
                except Exception as e:
                    print(f"⚠️ Error extracting {zip_path}: {e}")

if __name__ == "__main__":
    # Change this to your target directory, or leave it as current directory
    target_directory = os.getcwd()
    unzip_all_in_directory(target_directory)
