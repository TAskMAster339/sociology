"""Build editable DOCX from the versioned Markdown sources using python-docx."""
import re, json, sys
from pathlib import Path
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.opc.constants import RELATIONSHIP_TYPE as RT

ROOT=Path(__file__).resolve().parents[1]
SOURCES=json.loads((ROOT/'source/sources.json').read_text())
NAMES=['01 Социолог','02 Экономист','03 Политолог','04 Культуролог','05 Аналитик','06 Рассказчик и координатор','07 Общий текст выступления']
ACCENT='234E62'

def hyperlink(p,label,url,size=None):
    rid=p.part.relate_to(url,RT.HYPERLINK,is_external=True)
    h=OxmlElement('w:hyperlink'); h.set(qn('r:id'),rid)
    r=OxmlElement('w:r'); props=OxmlElement('w:rPr')
    c=OxmlElement('w:color'); c.set(qn('w:val'),ACCENT); props.append(c)
    u=OxmlElement('w:u'); u.set(qn('w:val'),'single'); props.append(u)
    if size:
        sz=OxmlElement('w:sz'); sz.set(qn('w:val'),str(size*2)); props.append(sz)
    r.append(props); t=OxmlElement('w:t'); t.text=label; r.append(t); h.append(r); p._p.append(h)

def rich(p,text):
    for s in re.split(r'(\*\*.*?\*\*|\[S\d{2}\])',text):
        if re.fullmatch(r'\[S\d{2}\]',s): hyperlink(p,s,SOURCES[s[1:-1]]['url'])
        elif s.startswith('**') and s.endswith('**'): p.add_run(s[2:-2]).bold=True
        else: p.add_run(s)

def table(doc,lines):
    rows=[[x.strip() for x in l.strip().strip('|').split('|')] for l in lines if not re.match(r'^\|[\s:|\-]+\|$',l)]
    t=doc.add_table(rows=1, cols=len(rows[0])); t.autofit=False
    widths=[1.1,2.5,2.9] if len(rows[0])==3 else [0.55,3.25,1.2,1.5]
    for col,w in zip(t.columns,widths): col.width=Inches(w)
    for ri,row in enumerate(rows):
        cells=t.rows[0].cells if ri==0 else t.add_row().cells
        for j,(cell,txt) in enumerate(zip(cells,row)):
            cell.width=Inches(widths[j]); cell.vertical_alignment=1
            p=cell.paragraphs[0]; rich(p,txt)
            p.paragraph_format.space_after=Pt(6); p.paragraph_format.space_before=Pt(6)
            for run in p.runs: run.font.size=Pt(10); run.bold=ri==0
            tcPr=cell._tc.get_or_add_tcPr(); shade=OxmlElement('w:shd'); shade.set(qn('w:fill'),'EAF0F3' if ri==0 else ('F7F8F9' if ri%2 else 'FFFFFF')); tcPr.append(shade)
            mar=OxmlElement('w:tcMar')
            for side in ['top','left','bottom','right']:
                e=OxmlElement('w:'+side); e.set(qn('w:w'),'90'); e.set(qn('w:type'),'dxa'); mar.append(e)
            tcPr.append(mar)
        trPr=t.rows[ri]._tr.get_or_add_trPr(); no=OxmlElement('w:cantSplit'); trPr.append(no)
        if ri==0: trPr.append(OxmlElement('w:tblHeader'))
    doc.add_paragraph().paragraph_format.space_after=Pt(2)

for src,name in zip(sorted((ROOT/'source').glob('[0-9]*.md')),NAMES):
    if len(sys.argv)>1 and src.stem[:2] not in sys.argv[1:]: continue
    md=src.read_text(); doc=Document(); sec=doc.sections[0]
    sec.page_width=Inches(8.5); sec.page_height=Inches(11)
    sec.top_margin=sec.bottom_margin=Inches(.72)
    sec.left_margin=sec.right_margin=Inches(.85)
    sec.header_distance=sec.footer_distance=Inches(.3)
    for sty in ['Normal','Title','Subtitle','Heading 1','Heading 2']:
        s=doc.styles[sty]; s.font.name='Carlito'; s.font.color.rgb=RGBColor.from_string('20272B')
    for element in doc.styles.element.iter():
        for child in list(element):
            if child.tag == qn('w:pBdr'): element.remove(child)
    normal=doc.styles['Normal']; normal.font.size=Pt(11)
    normal.paragraph_format.line_spacing=1.12; normal.paragraph_format.space_after=Pt(7)
    normal.paragraph_format.widow_control=True
    doc.styles['Title'].font.size=Pt(25); doc.styles['Title'].font.bold=True; doc.styles['Title'].font.color.rgb=RGBColor(0,0,0)
    doc.styles['Title'].paragraph_format.space_after=Pt(10)
    for h in ['Heading 1','Heading 2']:
        s=doc.styles[h]; s.font.size=Pt(14); s.font.bold=True; s.font.color.rgb=RGBColor.from_string(ACCENT)
        s.paragraph_format.space_before=Pt(12); s.paragraph_format.space_after=Pt(6)
    head=sec.header.paragraphs[0]; head.text='СОЦИОЛОГИЯ  /  КОМАНДА № 4'; head.runs[0].font.size=Pt(8); head.runs[0].font.color.rgb=RGBColor.from_string('67747B')
    foot=sec.footer.paragraphs[0]; foot.alignment=2
    r=foot.add_run(name[3:]+'  ·  '); r.font.size=Pt(8)
    f=OxmlElement('w:fldSimple'); f.set(qn('w:instr'),'PAGE'); foot._p.append(f)
    lines=md.splitlines(); i=0; page_before=False
    while i<len(lines):
        l=lines[i].strip(); i+=1
        if not l: continue
        if l=='<!-- page -->': page_before=True; continue
        if l.startswith('|'):
            arr=[l]
            while i<len(lines) and lines[i].strip().startswith('|'): arr.append(lines[i]); i+=1
            table(doc,arr); continue
        if l.startswith('# '): doc.add_paragraph(l[2:],'Title'); continue
        if l.startswith('## '):
            p=doc.add_paragraph(l[3:],'Heading 1')
            if page_before: p.paragraph_format.page_break_before=True; page_before=False
            continue
        p=doc.add_paragraph()
        if l.startswith('Команда №') or l.startswith('Время '):
            p.style='Subtitle'; p.paragraph_format.space_after=Pt(9)
        rich(p,l)
        if l.startswith('Команда №') or l.startswith('Время '):
            for r in p.runs: r.font.size=Pt(10); r.font.color.rgb=RGBColor.from_string('67747B')
    p=doc.add_paragraph('Список источников','Heading 1'); p.paragraph_format.page_break_before=True
    p=doc.add_paragraph('Дата обращения к ссылкам 11 ноября 2026 года. Коды в тексте открывают соответствующий источник.'); p.paragraph_format.space_after=Pt(8)
    for sid in sorted(set(re.findall(r'\[(S\d{2})\]',md))):
        s=SOURCES[sid]; p=doc.add_paragraph(); p.paragraph_format.keep_together=True
        hyperlink(p,f'[{sid}] {s["title"]}',s['url'],9); p.add_run(f'. {s["year"]}.')
        p.add_run('\n'+s['use'])
        for r in p.runs:r.font.size=Pt(9)
    doc.core_properties.title=md.splitlines()[0][2:]; doc.core_properties.author='Команда № 4'; doc.core_properties.subject='Гибридные и переходные общества'; doc.core_properties.language='ru-RU'
    (ROOT/'output').mkdir(exist_ok=True)
    doc.save(ROOT/'output'/f'{name}.docx')
    print(name)
