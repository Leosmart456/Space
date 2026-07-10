import re

content = open("artifacts/spacex-platform/src/index.css").read()

vars_to_black = [
    "--background", "--card", "--popover", "--sidebar",
    "--secondary", "--muted", "--input"
]

for v in vars_to_black:
    content = re.sub(rf"({v}: )[^;]+;", r"\g<1>0 0% 0%;", content)

content = re.sub(r"(--border: )[^;]+;", r"\g<1>0 0% 12%;", content)
content = re.sub(r"(--card-border: )[^;]+;", r"\g<1>0 0% 12%;", content)
content = re.sub(r"(--popover-border: )[^;]+;", r"\g<1>0 0% 12%;", content)
content = re.sub(r"(--sidebar-border: )[^;]+;", r"\g<1>0 0% 12%;", content)

content = content.replace("background: #080c12 !important;", "background: #000000 !important;")

open("artifacts/spacex-platform/src/index.css", "w").write(content)
