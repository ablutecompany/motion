import os

results = []
for root, _, files in os.walk('src'):
    for file in files:
        if file.endswith('.ts') or file.endswith('.tsx') or file.endswith('.md'):
            path = os.path.join(root, file)
            try:
                with open(path, 'r', encoding='utf-8') as f:
                    content = f.read()
                    has_mojibake = ('Ãƒ' in content or 'Ã§' in content or 'Ã£' in content or 'Ãµ' in content or 'Ã©' in content or 'Ã¡' in content or 'Ã‰' in content or 'Ã“' in content or 'Ã ' in content)
                    has_replacement = '\ufffd' in content
                    if has_mojibake or has_replacement:
                        results.append(path)
            except Exception as e:
                pass

print('Affected files:', results)
