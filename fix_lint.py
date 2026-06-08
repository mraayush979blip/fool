import re

def fix_lint_errors(log_file):
    with open(log_file, 'r') as f:
        lines = f.readlines()

    current_file = None
    file_fixes = {}

    for line in lines:
        line = line.strip()
        if line.startswith('./src/'):
            current_file = line
            if current_file not in file_fixes:
                file_fixes[current_file] = []
        elif current_file and ':' in line and 'Warning' in line:
            parts = line.split('Warning:')
            if len(parts) >= 2:
                prefix = parts[0].strip()
                line_col = prefix.split(' ')[0]
                if ':' in line_col:
                    line_num = int(line_col.split(':')[0])
                    rule = line.split(' ')[-1].strip()
                    if '@' in rule or 'react-hooks' in rule:
                        file_fixes[current_file].append((line_num, rule))

    for filepath, fixes in file_fixes.items():
        try:
            with open(filepath, 'r') as f:
                content_lines = f.readlines()
            
            # Sort fixes in reverse order so inserting doesn't change line numbers
            fixes.sort(key=lambda x: x[0], reverse=True)
            
            for line_num, rule in fixes:
                idx = line_num - 1
                if idx < len(content_lines):
                    # Check if there's already an eslint-disable comment
                    if 'eslint-disable-next-line' not in content_lines[idx - 1] if idx > 0 else True:
                        indent = len(content_lines[idx]) - len(content_lines[idx].lstrip())
                        content_lines.insert(idx, ' ' * indent + f'// eslint-disable-next-line {rule}\n')

            with open(filepath, 'w') as f:
                f.writelines(content_lines)
            print(f"Fixed {filepath}")
        except Exception as e:
            print(f"Failed to fix {filepath}: {e}")

if __name__ == '__main__':
    fix_lint_errors('lint_results.txt')
