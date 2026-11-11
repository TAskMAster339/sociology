import fs from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {Presentation,PresentationFile} from '@oai/artifact-tool';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const skill=process.env.SOCIOLOGY_PRESENTATIONS_SKILL ?? '/home/TAskMAster339/.codex/plugins/cache/openai-primary-runtime/presentations/26.1110.11613/skills/presentations';
const runtime=process.env.SOCIOLOGY_RUNTIME ?? '/home/TAskMAster339/.cache/codex-runtimes/codex-primary-runtime/dependencies';
process.env.RUNTIME_NODE_MODULES=path.join(runtime,'node/node_modules');
const {finalizePresentation,applyPresentationChartFont}=await import(pathToFileURL(path.join(skill,'container_tools/artifact_tool_utils.mjs')));
const sources=JSON.parse(await fs.readFile(path.join(root,'source/sources.json'),'utf8'));
const speech=await fs.readFile(path.join(root,'source/07_speech.md'),'utf8');
const sections=speech.split(/## Слайд \d[^\n]*\n/).slice(1).map(t=>t.split('## Памятка')[0].replaceAll('<!-- page -->','').trim());
const p=Presentation.create({slideSize:{width:1280,height:720}});
const C={bg:'#F8F7F3',ink:'#202E36',muted:'#64747D',accent:'#215B68',warm:'#A16443'};
const font='Carlito';
function txt(s,t,x,y,w,h,size=30,bold=false,color=C.ink){
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=t;sh.text.style={typeface:font,fontSize:size,bold,color,insets:0,verticalAlignment:'top',autoFit:'none',wrap:'square'};return sh;
}
function base(title,num,topic){
 const s=p.slides.add();s.background.fill=C.bg;
 txt(s,'КОМАНДА № 4  /  '+topic.toUpperCase(),64,32,1120,28,17,true,C.accent);
 txt(s,title,64,87,1152,112,45,true);
 txt(s,'Гибридные и переходные общества',64,668,1000,24,17,false,C.muted);
 txt(s,String(num).padStart(2,'0')+' / 07',1120,668,100,24,17,false,C.muted);
 const ss=sections[num-1];const ids=[...new Set(ss.match(/S\d{2}/g)||[])];
 s.speakerNotes.text=ss+'\n\nИСТОЧНИКИ\n'+ids.map(id=>`[${id}] ${sources[id].title}. ${sources[id].year}. ${sources[id].url}\n${sources[id].use}`).join('\n\n');
 return s;
}
let s=base('Гибридные и\nпереходные общества',1,'Паспорт общества');
// Cover title is narrower to leave a clear photo column.
s.shapes.items[1].position={left:64,top:120,width:660,height:150};s.shapes.items[1].text.style={typeface:font,fontSize:54,bold:true,color:C.ink,insets:0,autoFit:'none'};
txt(s,'Гибридность',64,330,580,45,31,true,C.accent);
txt(s,'Сочетание разных общественных укладов',64,382,570,80,30);
txt(s,'Переходность',64,490,580,45,31,true,C.accent);
txt(s,'Изменение общества во времени',64,542,570,75,30);
const photo=await fs.readFile(path.join(root,'assets/bengaluru.jpg'));
s.images.add({blob:photo.buffer.slice(photo.byteOffset,photo.byteOffset+photo.byteLength),contentType:'image/jpeg',alt:'Панорама Бангалора. Фото Mahadev Ittina, Unsplash',fit:'cover',position:{left:770,top:110,width:446,height:490}});
txt(s,'Бангалор · Mahadev Ittina / Unsplash',770,612,446,30,16,false,C.muted);
s.speakerNotes.append('\nФото: Mahadev Ittina, Unsplash. https://unsplash.com/photos/a-view-of-a-city-from-the-top-of-a-hill-vJ94Yh36524\nИллюстрация города, не доказательство социальных отношений.');
s=base('Социальные возможности и ограничения',2,'Социолог');
const rows=[['Достижения','Образование и профессия открывают новые пути'],['Происхождение','Семейные ресурсы и статусные границы сохраняют значение'],['Институты','Доступ к услугам влияет на результат переезда']];
rows.forEach((r,i)=>{txt(s,r[0],64,220+i*118,300,52,31,true,C.accent);txt(s,r[1],400,220+i*118,790,88,31);});
txt(s,'Переезд в город ещё не означает социального подъёма',64,593,1120,45,29,true);
s=base('Занятость по секторам в Индии',3,'Экономист');
txt(s,'46,1%',64,220,500,110,86,true,C.accent);
txt(s,'занятых в сельском\nхозяйстве Индии',64,340,490,100,35,true);
txt(s,'Июль 2023 — июнь 2024\nPLFS · usual status (ps+ss)',64,466,490,72,24,false,C.muted);
const ch=s.charts.add('bar',{
 position:{left:550,top:204,width:662,height:374},
 categories:['Сельское хозяйство','Пром. и строительство','Услуги'],
 series:[{name:'Доля занятых, %',values:[46.1,24.1,29.7],fill:C.accent}],
 hasLegend:false,
 barOptions:{direction:'column',gapWidth:85},
 dataLabels:{showValue:true,position:'outEnd',textStyle:{fontSize:24,bold:true},numberFormatCode:'0.0"%"'},
 xAxis:{textStyle:{fontSize:18}},
 yAxis:{min:0,max:60,majorUnit:20,textStyle:{fontSize:20},numberFormatCode:'0"%"',majorGridlines:{fill:'#D9DFE1',width:1}},
 chartFill:C.bg,
 plotAreaFill:C.bg,
});
applyPresentationChartFont(ch,{fontFamily:font});
txt(s,'MoSPI, PLFS 2023–24, Statement 7, с. 15.\nГруппировка по отраслям. Сумма 99,9% из-за округления.',550,593,662,58,18,false,C.muted);
s=base('Государство и культурные изменения',4,'Политолог и культуролог');
txt(s,'ПОЛИТИКА',64,220,520,45,24,true,C.accent);
txt(s,'Новые институты\nи прежние способы влияния',64,285,520,110,36,true);
txt(s,'Япония Мэйдзи:\nконституция и парламент\nпри императорской власти',64,435,520,145,29);
txt(s,'КУЛЬТУРА',680,220,520,45,24,true,C.accent);
txt(s,'Новые технологии\nи устойчивые нормы',680,285,520,110,36,true);
txt(s,'Индия:\nцифровые брачные анкеты\nи кастовые предпочтения',680,435,520,145,29);
txt(s,'Общественный уклад и политический режим — разные измерения',64,610,1152,40,26,true,C.warm);
s=base('Три примера разных сочетаний',5,'Аналитик');
const values=[['Пример','Что сочетается','Что объясняет'],['Япония Мэйдзи\n1868–1912','Школа, парламент\nи императорская власть','Роль прежних институтов\nв модернизации'],['Индия\n2019–2024','Сельский труд, передовые фирмы\nи статусные границы','Разные темпы изменений\nв экономике и обществе'],['Китай\n2024','Городская работа и барьеры\nдоступа к услугам','Влияние институтов\nна возможности мигрантов']];
const tb=s.tables.add({rows:4,columns:3,left:64,top:220,width:1152,height:360,columnWidths:[242,470,440],values});
tb.borders.assign({fill:'#CED7DB',width:1});
tb.cells.block({row:0,column:0,rowCount:4,columnCount:3}).assign({textStyle:{typeface:font,fontSize:26,color:C.ink},margins:{left:14,right:14,top:12,bottom:12},anchor:'center'});
for(let r=0;r<4;r++){tb.rows[r].height=r===0?58:100;for(let c=0;c<3;c++){const ce=tb.getCell(r,c);ce.fill=r===0?'#E3ECEE':C.bg;ce.text.style={typeface:font,fontSize:r===0?25:25,bold:r===0,color:r===0?C.accent:C.ink};}}
txt(s,'Сравниваем механизмы, а не места стран на одной шкале',64,610,1152,42,28,true);
s=base('Один переезд — четыре стороны анализа',6,'Учебный мини кейс');
txt(s,'Арун, 22 года: село → Бангалор',64,210,1152,65,38,true,C.accent);
txt(s,'Курс технической поддержки · временная доставка · помощь семьи',64,280,1152,60,28);
const cr=[['Социолог','Изменились ли жизненные шансы?'],['Экономист','Устойчивы ли работа и доход?'],['Политолог','Доступны ли правила и защита прав?'],['Культуролог','Как согласуются самостоятельность и долг семье?']];
cr.forEach((r,i)=>{txt(s,r[0],64,367+i*57,275,45,28,true);txt(s,r[1],360,367+i*57,856,50,28);});
txt(s,'Ситуация вымышлена. Это способ объяснения, а не статистическое доказательство.',64,610,1152,44,21,false,C.warm);
s=base('Выводы и вопросы для обсуждения',7,'Общий результат');
txt(s,'Сферы общества меняются\nнеодинаково',64,220,1152,120,48,true,C.accent);
txt(s,'Технологии · труд · институты · ценности',64,365,1152,60,31);
txt(s,'Обязательно ли идти к единому образцу развития?',64,475,1152,65,34,true);
txt(s,'Может ли сочетание разных укладов быть устойчивым?',64,560,1152,70,34,true);
await fs.mkdir(path.join(root,'build/slides'),{recursive:true});
for(let i=0;i<p.slides.items.length;i++){
 const slide=p.slides.items[i];
 await fs.writeFile(path.join(root,'build/slides',`slide-${i+1}.png`),new Uint8Array(await (await p.export({slide,format:'png',scale:1.4})).arrayBuffer()));
 console.log('Rendered slide',i+1);
}
const candidatePath=path.join(root,'build/candidate.pptx');
await (await PresentationFile.exportPptx(p)).save(candidatePath);
await fs.mkdir(path.join(root,'output'),{recursive:true});
const finalPath=path.join(root,'output/08 Гибридные и переходные общества.pptx');
await finalizePresentation({workspaceDir:root,candidatePath,finalPath,pythonExecutable:path.join(runtime,'python/bin/python3'),integrityValidatorPath:path.join(skill,'container_tools/inspect_presentation_package_integrity.py'),layoutValidatorPath:path.join(skill,'container_tools/inspect_presentation_layout_geometry.py'),layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit','--require-native-table-slide','5'],explicitTotalSlideCount:7,requiredNativeTableOwnerSlides:[5],requiredNativeChartOwnerSlides:[3],materializeLiteralChartWorkbooks:true,fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:path.join(root,'build/presentation-validation.json')});
console.log(finalPath);
