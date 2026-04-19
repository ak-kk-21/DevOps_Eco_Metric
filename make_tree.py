import os

EXCLUDE = {"node_modules", "__pycache__", ".git", ".venv"}

def print_tree(start_path, prefix=""):
    items = sorted(os.listdir(start_path))
    items = [i for i in items if i not in EXCLUDE]

    for index, item in enumerate(items):
        path = os.path.join(start_path, item)
        connector = "└── " if index == len(items) - 1 else "├── "
        print(prefix + connector + item)

        if os.path.isdir(path):
            extension = "    " if index == len(items) - 1 else "│   "
            print_tree(path, prefix + extension)

print_tree(".")