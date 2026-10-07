
import os
import re

directories = [
    'src/dashboards/parent/pages',
    'src/dashboards/mca/pages'
]

for directory in directories:
    for filename in os.listdir(directory):
        if filename.endswith('.jsx'):
            filepath = os.path.join(directory, filename)
            with open(filepath, 'r') as f:
                content = f.read()
                imports = re.findall(r"import .* from ['\"](.*)['\"]", content)
                for import_path in imports:
                    if import_path.startswith('.'):
                        # Construct absolute path of the imported file
                        import_dir = os.path.dirname(filepath)
                        target_path = os.path.abspath(os.path.join(import_dir, import_path))
                        
                        # Check if target file exists
                        if not os.path.exists(target_path):
                            print(f"Broken import in {filepath}: {import_path}")
