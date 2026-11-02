// Fontes consultadas em 02/11/2026. Consumo médio e potência nominal são grandezas distintas.
const MODELOS_IMPRESSORAS = [
 {id:'bambu-a1',nome:'Bambu Lab A1',watts:130,nota:'Estimativa inicial de 130 W para cálculo. Não é uma média oficial confirmada. Ajuste conforme o consumo medido da sua impressão.',fonte:'https://bambulab.com/en/a1/tech-specs'},
 {id:'bambu-a1-mini',nome:'Bambu Lab A1 mini',watts:130,nota:'Estimativa inicial de 130 W para cálculo. Não é uma média oficial confirmada. Ajuste conforme o consumo medido da sua impressão.',fonte:'https://bambulab.com/en/a1-mini/tech-specs'},
 {id:'flashforge-ad5x',nome:'Flashforge AD5X',watts:130,nota:'Estimativa inicial de consumo médio: 130 W, não confirmada pelo fabricante. A fonte nominal é de 650 W; esse valor não representa a média durante a impressão.',fonte:'https://wiki.flashforge.com/resource/pictures/ad5x_picture/ad5x_introduction/ad5x_user_guide_%28cn%2Ben%29.pdf'},
 {id:'snapmaker-u1',nome:'Snapmaker U1',watts:127.4,nota:'Referência do fabricante: PLA em quatro cores, bico a 220 °C e mesa a 65 °C: 127,4 W. Em PLA de uma cor: 117,8 W. Ajuste para outras condições.',fonte:'https://wiki.snapmaker.com/en/FAQ/u1'}
];
window.modelosImpressoras=MODELOS_IMPRESSORAS;
function modeloPorId(id){return MODELOS_IMPRESSORAS.find(m=>'modelo:'+m.id===id);}
function textoModelo(m){return m.nota;}
const blocoModelo=document.createElement('div');blocoModelo.className='fg';blocoModelo.style.marginBottom='18px';
blocoModelo.innerHTML='<label for="modelo-impressora">Escolha sua impressora</label><select id="modelo-impressora"><option value="">Selecione um modelo</option>'+MODELOS_IMPRESSORAS.map(m=>'<option value="modelo:'+m.id+'">'+m.nome+'</option>').join('')+'<option value="manual">Outra impressora — cadastrar manualmente</option></select><p id="modelo-nota" class="gestao-ajuda" aria-live="polite"></p>';
const corpoImpressoras=document.querySelector('#tab-impressoras .card-body');corpoImpressoras.prepend(blocoModelo);
// Os campos são preenchidos pelo modelo; detalhes ficam disponíveis para personalização.
const detalhesModelo=document.createElement('details');const tituloDetalhes=document.createElement('summary');tituloDetalhes.textContent='Conferir / personalizar os valores';tituloDetalhes.style.cursor='pointer';detalhesModelo.append(tituloDetalhes);
const grade=corpoImpressoras.querySelector('.fgrid');const valorMaquina=document.getElementById('p-valor-total').closest('.fg');grade.before(detalhesModelo);detalhesModelo.append(grade,valorMaquina);
function escolherModelo(){
 const id=document.getElementById('modelo-impressora').value,m=modeloPorId(id);const cfg=DB.cfg;
 if(m){document.getElementById('p-nome').value=m.nome;document.getElementById('p-watts').value=m.watts;document.getElementById('p-kwh').value=cfg.kwh??1.16;document.getElementById('p-vida').value=cfg.vida??20000;document.getElementById('p-falhas').value=cfg.falhas??5;document.getElementById('p-valor-total').value=cfg.maquina??0;
 document.getElementById('modelo-nota').innerHTML=htmlSeguro(textoModelo(m))+' <a target="_blank" rel="noopener" href="'+m.fonte+'">Fonte do modelo</a><br>Tarifa, vida útil, falhas e valor da máquina vêm da sua Configuração e podem ser personalizados.';detalhesModelo.open=false;
 }else{['p-nome','p-watts','p-kwh','p-vida','p-falhas','p-valor-total'].forEach(id=>document.getElementById(id).value='');document.getElementById('modelo-nota').textContent=id==='manual'?'Preencha os dados da sua impressora abaixo.':'';detalhesModelo.open=id==='manual';}
}
document.getElementById('modelo-impressora').addEventListener('change',escolherModelo);
const cadastrarImpressoraBase=addPrinter;
addPrinter=function(){const modelo=document.getElementById('modelo-impressora').value;if(!modelo){toast('Selecione um modelo ou a opção de cadastro manual.');return;}const antes=DB.printers.length;cadastrarImpressoraBase();if(DB.printers.length>antes){document.getElementById('modelo-impressora').value='';document.getElementById('modelo-nota').textContent='';detalhesModelo.open=false;}};
const reconstruirImpressorasBase=rebuildPrinterSelect;
rebuildPrinterSelect=function(){const sel=document.getElementById('c-impressora'),atual=sel.value;reconstruirImpressorasBase();const grupo=document.createElement('optgroup');grupo.label='Modelos sugeridos';for(const m of MODELOS_IMPRESSORAS){const opt=document.createElement('option');opt.value='modelo:'+m.id;opt.textContent=m.nome;grupo.append(opt);}sel.append(grupo);sel.value=atual;};
const carregarImpressoraBase=loadPrinter;
loadPrinter=function(){const m=modeloPorId(document.getElementById('c-impressora').value);if(!m){carregarImpressoraBase();return;}const cfg=DB.cfg;document.getElementById('c-watts').value=m.watts;document.getElementById('c-kwh').value=cfg.kwh??1.16;document.getElementById('c-vida').value=cfg.vida??20000;document.getElementById('c-maquina').value=cfg.maquina??0;document.getElementById('c-falhas').value=cfg.falhas??5;const info=document.getElementById('c-printer-amor-info');info.style.display='block';info.textContent=m.nome+': '+textoModelo(m)+' Demais valores: sua Configuração.';calcular();};
rebuildPrinterSelect();
