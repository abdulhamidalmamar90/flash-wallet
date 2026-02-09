import os

def aggregate_files():
    """
    Traverses the project directory and aggregates source code into three specific files:
    - disbackup.txt: Design & UI files.
    - probackup.txt: Logic & Performance files.
    - fullbackup.txt: Complete archive of both categories.
    """
    # Configuration
    ignore_folders = {'node_modules', '.git', '.firebase', 'build', 'dist', '__pycache__', '.next'}
    
    # Extension categories
    design_extensions = {'.html', '.css', '.scss', '.svelte', '.jsx', '.tsx', '.xml', '.svg'}
    logic_extensions = {'.js', '.ts', '.py', '.json', '.sql', '.dart', '.php'}
    
    # Output file paths
    dis_backup_path = 'disbackup.txt'
    pro_backup_path = 'probackup.txt'
    full_backup_path = 'fullbackup.txt'

    print("🚀 Initializing code aggregation...")

    # Open output files with UTF-8 encoding
    try:
        with open(dis_backup_path, 'w', encoding='utf-8') as dis_f, \
             open(pro_backup_path, 'w', encoding='utf-8') as pro_f, \
             open(full_backup_path, 'w', encoding='utf-8') as full_f:
            
            file_count = 0
            
            for root, dirs, files in os.walk('.'):
                # Prune ignored folders in-place to prevent os.walk from entering them
                dirs[:] = [d for d in dirs if d not in ignore_folders]
                
                for file in files:
                    # Avoid aggregating the output files themselves or the script itself
                    if file in [dis_backup_path, pro_backup_path, full_backup_path, 'aggregate_backup.py']:
                        continue
                        
                    file_path = os.path.join(root, file)
                    ext = os.path.splitext(file)[1].lower()
                    
                    is_design = ext in design_extensions
                    is_logic = ext in logic_extensions
                    
                    if is_design or is_logic:
                        # Standardize path display for the header
                        display_path = file_path.replace('.\\', '').replace('./', '')
                        if not display_path.startswith('/'):
                            display_path = '/' + display_path
                            
                        header = f"\n--- START: {display_path} ---\n"
                        
                        try:
                            # Using errors='ignore' to gracefully handle any encoding mismatches in edge cases
                            with open(file_path, 'r', encoding='utf-8', errors='ignore') as source_f:
                                content = source_f.read()
                                
                                # Write to specific category files
                                if is_design:
                                    dis_f.write(header)
                                    dis_f.write(content)
                                    dis_f.write("\n")
                                
                                if is_logic:
                                    pro_f.write(header)
                                    pro_f.write(content)
                                    pro_f.write("\n")
                                
                                # Always write to the full archive
                                full_f.write(header)
                                full_f.write(content)
                                full_f.write("\n")
                                
                                file_count += 1
                                print(f"✅ Processed: {display_path}")
                                
                        except Exception as e:
                            print(f"⚠️ Error reading {file_path}: {e}")

            print(f"\n✨ Success! Aggregated {file_count} files.")
            print(f"📁 Files generated: {dis_backup_path}, {pro_backup_path}, {full_backup_path}")

    except Exception as e:
        print(f"❌ Fatal error during aggregation: {e}")

if __name__ == "__main__":
    aggregate_files()
