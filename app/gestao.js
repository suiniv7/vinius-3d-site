// Gestão simplificada. Produtos privados pertencem ao usuário do Kalcula3D.
const el = id => document.getElementById(id);
const htmlSeguro = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const centavos = value => Math.round((Number(value) + Number.EPSILON) * 100);
const hojeISO = () => { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; };
function dataISOvenda(v) { return /^\d{4}-\d{2}-\d{2}$/.test(v.data||'') ? v.data : (v.data||'').split('/').reverse().join('-'); }
function totalVenda(v) { return Number.isFinite(Number(v.total)) ? centavos(v.total) : centavos(v.valor)*Number(v.qtd||0); }
function recebidoVenda(v) { const t=totalVenda(v); return v.pago==='sim'?t:v.pago==='50'?Math.round(t/2):0; }
function resumoVendas(vendas) {
 return vendas.reduce((r,v)=>{const t=totalVenda(v), recebido=recebidoVenda(v); r.total+=t;r.recebido+=recebido;r.aberto+=t-recebido;r.unidades+=Number(v.qtd)||0;
 if(Number.isFinite(v.custoUnitario)){r.lucro+=t-centavos(v.custoUnitario)*Number(v.qtd);r.comCusto++;} return r;}, {total:0,recebido:0,aberto:0,unidades:0,lucro:0,comCusto:0});
}

const estiloGestao = document.createElement('style');
estiloGestao.textContent=`.gestao-resumo{display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:12px;margin:18px 0}.gestao-numero{padding:18px;border:1px solid var(--border);border-radius:10px;background:var(--card)}.gestao-numero small{display:block;color:var(--muted);margin-bottom:8px}.gestao-numero strong{font-family:var(--mono);font-size:1.25rem}.gestao-ajuda{font-size:.82rem;color:var(--muted);line-height:1.6;margin:10px 0}.gestao-tabela{overflow-x:auto}.gestao-acoes{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px}#modo-teste-aviso{padding:10px 20px;background:#fff2ce;color:#654300;text-align:center;font-size:.85rem}#notas-btn,#notas-panel{display:none!important}nav button:focus-visible{outline:2px solid var(--accent);outline-offset:2px}`;
document.head.append(estiloGestao);
const paginasGestao = document.createElement('div');
paginasGestao.innerHTML=`
<div id="tab-produtos" class="tab">
 <div class="ph"><h1>Produtos</h1><p>Saiba quanto custa produzir e por quanto vender cada peça.</p></div>
 <form id="form-produto" class="card" style="padding:20px;margin-bottom:20px">
  <h2 id="produto-titulo">Cadastrar produto</h2><input type="hidden" id="produto-id">
  <p class="gestao-ajuda">Preencha manualmente ou use “Cadastrar produto” ao terminar um cálculo. Os valores são por unidade.</p>
  <div class="fgrid">
   <div class="fg"><label for="produto-nome">Nome do produto</label><input id="produto-nome" required maxlength="120"></div>
   <div class="fg"><label for="produto-custo">Custo por unidade (R$)</label><input id="produto-custo" type="number" min="0" step=".01" required></div>
   <div class="fg"><label for="produto-sugerido">Preço sugerido (R$)</label><input id="produto-sugerido" type="number" min="0" step=".01" required></div>
   <div class="fg"><label for="produto-preco">Preço de venda padrão (R$)</label><input id="produto-preco" type="number" min="0" step=".01" required></div>
  </div>
  <div class="gestao-acoes"><button class="btn btn-green" type="submit">Salvar produto</button><button class="btn btn-ghost" type="button" onclick="limparProduto()">Cancelar / novo</button></div>
 </form>
 <div class="card" style="padding:20px"><h2>Meus produtos</h2><p class="gestao-ajuda">Alterar um produto não muda o custo ou o preço das vendas já registradas. Este cadastro é da gestão; não publica produtos na loja.</p><div id="lista-produtos" class="gestao-tabela"></div><div id="ficha-produto"></div></div>
</div>
<div id="tab-vendas-mes" class="tab">
 <div class="ph"><h1>Vendas</h1><p>Registre o que vendeu e acompanhe o dinheiro que entrou.</p></div>
 <div class="fg" style="max-width:230px"><label for="mes-vendas">Mês das vendas</label><input id="mes-vendas" type="month" onchange="renderVendasMes()"></div>
 <div id="resumo-vendas" class="gestao-resumo" aria-live="polite"></div>
 <p class="gestao-ajuda">“Entrou” considera o pagamento informado nas vendas deste mês: pago = total, 50% = metade, não pago = zero. Não é um extrato pela data de recebimento.</p>
 <form id="form-venda-mes" class="card" style="padding:20px;margin:18px 0">
  <h2 id="venda-titulo">Registrar venda</h2><input type="hidden" id="venda-id">
  <div class="fgrid" style="margin-top:14px">
   <div class="fg"><label for="venda-data">Data da venda</label><input id="venda-data" type="date" required></div>
   <div class="fg"><label for="venda-produto">Produto cadastrado</label><select id="venda-produto" required onchange="selecionarProdutoVenda()"></select></div>
   <div class="fg"><label for="venda-cliente">Cliente (opcional)</label><input id="venda-cliente" maxlength="120"></div>
   <div class="fg"><label for="venda-qtd">Quantidade</label><input id="venda-qtd" type="number" min="1" step="1" value="1" required oninput="previewVenda()"></div>
   <div class="fg"><label for="venda-preco">Preço por unidade cobrado (R$)</label><input id="venda-preco" type="number" min="0" step=".01" required oninput="previewVenda()"></div>
   <div class="fg"><label for="venda-pago">Pagamento</label><select id="venda-pago" onchange="previewVenda()"><option value="sim">Pago</option><option value="50">50% pago</option><option value="nao">Não pago</option></select></div>
  </div>
  <p class="gestao-ajuda">Pode dar desconto por quantidade: altere o preço por unidade para esta venda. O preço do cadastro continua igual.</p>
  <p id="venda-preview" aria-live="polite"></p>
  <div class="gestao-acoes"><button class="btn btn-green" type="submit">Salvar venda</button><button class="btn btn-ghost" type="button" onclick="limparVenda()">Cancelar / nova</button></div>
 </form>
 <div class="card" style="padding:20px"><h2>Vendas do período</h2><div id="lista-vendas-mes" class="gestao-tabela"></div></div>
</div>`;
const mainGestao = document.querySelector('#app-screen main');
while(paginasGestao.firstChild) mainGestao.append(paginasGestao.firstChild);

let rascunhoCalculo = null;
let produtoCalculadoraId = null;
let materiaisDoCalculo = null;
function filamentosDoCalculo(){
 const atuais=DB.fils;
 if(!materiaisDoCalculo)return atuais;
 return [...materiaisDoCalculo,...atuais.filter(f=>!materiaisDoCalculo.some(m=>m.id===f.id))];
}
function limparProduto(){
 rascunhoCalculo=null;el('form-produto').reset();el('produto-id').value='';el('produto-titulo').textContent='Cadastrar produto';}
function produtoDoCalculo(){
 const nome=el('c-nome').value.trim();const r=calcular();
 if(!nome){toast('Dê um nome ao produto na calculadora.');return;}
 const ficha=capturarCalculo();
 limparProduto();showTab('produtos');rascunhoCalculo=ficha;
 if(produtoCalculadoraId){el('produto-id').value=produtoCalculadoraId;el('produto-titulo').textContent='Atualizar produto calculado';}
 el('produto-nome').value=nome;
 el('produto-custo').value=r.custoUn.toFixed(2);el('produto-sugerido').value=r.precoConsumidor.toFixed(2);el('produto-preco').value=r.precoFinal.toFixed(2);
 el('produto-nome').focus();toast('Confira os valores por unidade e salve o produto.');
}
function salvarProduto(e){
 e.preventDefault();if(!el('form-produto').reportValidity())return;
 const id=el('produto-id').value||uid();const nome=el('produto-nome').value.trim();
 const custo=Number(el('produto-custo').value), sugerido=Number(el('produto-sugerido').value), preco=Number(el('produto-preco').value);
 if(!nome||![custo,sugerido,preco].every(n=>Number.isFinite(n)&&n>=0)){toast('Confira nome e valores do produto.');return;}
 const anterior=DB.produtos.find(p=>p.id===id);
 const produto={...anterior,id,nome,custo,sugerido,preco,ativo:true};
 if(rascunhoCalculo)produto.calculo=JSON.parse(JSON.stringify(rascunhoCalculo));
 if(rascunhoCalculo)produtoCalculadoraId=id;
 DB.produtos=[produto,...DB.produtos.filter(p=>p.id!==id)];limparProduto();atualizarGestao();toast('Produto salvo.');
}
function editarProduto(id){rascunhoCalculo=null;const p=DB.produtos.find(p=>p.id===id);if(!p)return;
 if(p.calculo){reabrirCalculoProduto(id);return;}
 showTab('produtos');el('produto-id').value=p.id;el('produto-nome').value=p.nome;el('produto-custo').value=p.custo;el('produto-sugerido').value=p.sugerido;el('produto-preco').value=p.preco;el('produto-titulo').textContent='Editar produto';el('form-produto').scrollIntoView({behavior:'smooth'});}
function arquivarProduto(id){if(!confirm('Arquivar este produto? As vendas anteriores serão mantidas.'))return;DB.produtos=DB.produtos.map(p=>p.id===id?{...p,ativo:false}:p);atualizarGestao();toast('Produto arquivado.');}
function renderProdutos(){
 const produtos=DB.produtos.filter(p=>p.ativo!==false);
 el('lista-produtos').innerHTML=produtos.length?`<table><thead><tr><th>Produto</th><th>Custo/un.</th><th>Sugerido/un.</th><th>Venda padrão/un.</th><th>Lucro bruto/un.</th><th>Ações</th></tr></thead><tbody>${produtos.map(p=>`<tr><td><button type="button" class="btn btn-sm" data-ver-produto="${htmlSeguro(p.id)}">${htmlSeguro(p.nome)}</button></td><td>${R(p.custo)}</td><td>${R(p.sugerido)}</td><td>${R(p.preco)}</td><td>${R((centavos(p.preco)-centavos(p.custo))/100)}</td><td><button type="button" class="btn btn-sm" data-editar-produto="${htmlSeguro(p.id)}">Editar</button> <button type="button" class="btn btn-sm" data-arquivar-produto="${htmlSeguro(p.id)}">Arquivar</button></td></tr>`).join('')}</tbody></table>`:'<p class="gestao-ajuda">Nenhum produto cadastrado. Faça um cálculo e clique em Cadastrar produto, ou preencha o formulário acima.</p>';
}
function opcoesProdutos(){
 const sel=el('venda-produto'), atual=sel.value, editada=DB.vendas.find(v=>v.id===el('venda-id').value);
 sel.innerHTML='<option value="">Selecione um produto</option>'+DB.produtos.filter(p=>p.ativo!==false||p.id===editada?.produtoId).map(p=>`<option value="${htmlSeguro(p.id)}">${htmlSeguro(p.nome)}${p.ativo===false?' (arquivado)':''}</option>`).join('');
 if(editada&&!editada.produtoId){const opt=document.createElement('option');opt.value='legado';opt.textContent=editada.produto+' (venda anterior)';sel.append(opt);}
 sel.value=atual;
}
function selecionarProdutoVenda(){const p=DB.produtos.find(p=>p.id===el('venda-produto').value);if(p)el('venda-preco').value=p.preco;previewVenda();}
function previewVenda(){
 const qtd=Number(el('venda-qtd').value)||0,valor=Number(el('venda-preco').value)||0;
 const total=centavos(valor)*qtd;el('venda-preview').textContent=`Total desta venda: ${R(total/100)} · ${qtd} unidade(s) × ${R(valor)}`;
}
function limparVenda(){el('form-venda-mes').reset();el('venda-id').value='';el('venda-data').value=hojeISO();el('venda-titulo').textContent='Registrar venda';opcoesProdutos();previewVenda();}
function salvarVendaMes(e){
 e.preventDefault();if(!el('form-venda-mes').reportValidity())return;
 const id=el('venda-id').value||uid(), anterior=DB.vendas.find(v=>v.id===id), produtoId=el('venda-produto').value;
 const p=DB.produtos.find(p=>p.id===produtoId),qtd=Number(el('venda-qtd').value),valor=Number(el('venda-preco').value),iso=el('venda-data').value;
 if((!p&&!(anterior&&!anterior.produtoId&&produtoId==='legado'))||!Number.isInteger(qtd)||qtd<1||!Number.isFinite(valor)||valor<0||!/^\d{4}-\d{2}-\d{2}$/.test(iso)){toast('Confira produto, data, quantidade e preço.');return;}
 const mesmaReferencia=anterior&&((p&&anterior.produtoId===p.id)||produtoId==='legado');
 const venda={...anterior,id,data:iso.split('-').reverse().join('/'),cliente:el('venda-cliente').value.trim(),produto:mesmaReferencia?anterior.produto:p.nome,qtd,valor:centavos(valor)/100,total:centavos(valor)*qtd/100,pago:el('venda-pago').value};
 if(p){venda.produtoId=p.id;venda.custoUnitario=mesmaReferencia&&Number.isFinite(anterior.custoUnitario)?anterior.custoUnitario:p.custo;}
 DB.vendas=[venda,...DB.vendas.filter(v=>v.id!==id)];el('mes-vendas').value=iso.slice(0,7);limparVenda();renderVendasMes();toast('Venda salva.');
}
function editarVendaMes(id){
 const v=DB.vendas.find(v=>v.id===id);if(!v)return;el('venda-id').value=v.id;opcoesProdutos();el('venda-produto').value=v.produtoId||'legado';el('venda-data').value=dataISOvenda(v);el('venda-cliente').value=v.cliente||'';el('venda-qtd').value=v.qtd;el('venda-preco').value=v.valor;el('venda-pago').value=v.pago||'nao';el('venda-titulo').textContent='Editar venda';previewVenda();el('form-venda-mes').scrollIntoView({behavior:'smooth'});
}
function excluirVendaMes(id){if(!confirm('Excluir esta venda?'))return;DB.vendas=DB.vendas.filter(v=>v.id!==id);if(el('venda-id').value===id)limparVenda();renderVendasMes();toast('Venda excluída.');}
function renderVendasMes(){
 const mes=el('mes-vendas').value;if(!mes){el('mes-vendas').value=hojeISO().slice(0,7);}
 const vendas=DB.vendas.filter(v=>dataISOvenda(v).slice(0,7)===el('mes-vendas').value).sort((a,b)=>dataISOvenda(b).localeCompare(dataISOvenda(a)));
 const r=resumoVendas(vendas);
 el('resumo-vendas').innerHTML=[['Entrou',r.recebido],['Falta receber',r.aberto],['Total vendido',r.total]].map(([nome,n])=>`<div class="gestao-numero"><small>${nome}</small><strong>${R(n/100)}</strong></div>`).join('')+`<div class="gestao-numero"><small>Unidades vendidas</small><strong>${r.unidades}</strong></div>`;
 el('lista-vendas-mes').innerHTML=vendas.length?`<p class="gestao-ajuda">Lucro bruto previsto: ${r.comCusto?R(r.lucro/100):'—'} (receita menos custo de produção, antes de taxas e impostos). ${r.comCusto<vendas.length?'Vendas antigas sem custo salvo não entram nesse cálculo.':''}</p><table><thead><tr><th>Data</th><th>Produto / cliente</th><th>Qtd.</th><th>Preço/un.</th><th>Total</th><th>Entrou</th><th>Pagamento</th><th>Ações</th></tr></thead><tbody>${vendas.map(v=>`<tr><td>${htmlSeguro(v.data)}</td><td><strong>${htmlSeguro(v.produto)}</strong><br><small>${htmlSeguro(v.cliente||'')}</small></td><td>${htmlSeguro(v.qtd)}</td><td>${R(v.valor)}</td><td>${R(totalVenda(v)/100)}</td><td>${R(recebidoVenda(v)/100)}</td><td>${v.pago==='sim'?'Pago':v.pago==='50'?'50% pago':'Não pago'}</td><td><button type="button" class="btn btn-sm" data-editar-venda="${htmlSeguro(v.id)}">Editar</button> <button type="button" class="btn btn-sm" data-excluir-venda="${htmlSeguro(v.id)}">Excluir</button></td></tr>`).join('')}</tbody></table>`:'<p class="gestao-ajuda">Nenhuma venda neste mês. Selecione um produto cadastrado para registrar a primeira.</p>';
}
function atualizarGestao(){renderProdutos();opcoesProdutos();renderVendasMes();}
window.atualizarGestao=atualizarGestao;
el('form-produto').addEventListener('submit',salvarProduto);
el('form-venda-mes').addEventListener('submit',salvarVendaMes);
document.addEventListener('click', e=>{const b=e.target.closest?.('button');if(!b)return;for(const [attr,fn] of [['data-editar-impressora',openEditPrinter],['data-remover-impressora',delPrinter],['data-ver-produto',verProduto],['data-reabrir-calculo',reabrirCalculoProduto],['data-editar-produto',editarProduto],['data-arquivar-produto',arquivarProduto],['data-editar-venda',editarVendaMes],['data-excluir-venda',excluirVendaMes]])if(b.hasAttribute(attr))fn(b.getAttribute(attr));});
// O cadastro de materiais continua acessível em Configuração para alimentar o cálculo.
const materiais=el('tab-filamentos');materiais.classList.remove('tab');materiais.style.marginTop='28px';el('tab-config').append(materiais);
for(const id of ['cfg-lucro-desejado','cfg-reserva-pct'])el(id).closest('.fg').style.display='none';
const carregarConfigOriginal=loadConfig;
loadConfig=function(){carregarConfigOriginal();const c=DB.cfg;for(const [id,key,fallback] of [['cfg-watts','watts',130],['cfg-vida','vida',20000],['cfg-maquina','maquina',5000]])el(id).value=c[key]??fallback;};
saveConfig=function(){const f=el('tab-config');const inputs=Array.from(f.querySelectorAll('input[type=number]'));if(inputs.some(i=>!Number.isFinite(Number(i.value))||Number(i.value)<0)){toast('Confira os valores das configurações.');return;}const c={...DB.cfg};for(const key of ['markup','watts','kwh','falhas','vida','maquina','cartao','imposto'])c[key]=Number(el('cfg-'+key).value);DB.cfg=c;toast('Configurações salvas.');};

const CAMPOS_CALCULO=['c-nome','c-data','c-unidades','c-impressora','c-horas','c-watts','c-kwh','c-vida','c-maquina','c-falhas','c-imposto','c-cartao','c-anuncio','c-markup','c-gpg','c-override'];
function capturarCalculo(){
 const campos=Object.fromEntries(CAMPOS_CALCULO.map(id=>[id,el(id).value]));
 const materiais=filamentosDoCalculo();
 const filamentos=filRows.map(id=>({filamentoId:el('fsel-'+id).value,gramas:el('fg-'+id).value,material:materiais.find(f=>f.id===el('fsel-'+id).value)||null}));
 const acessorios=accRows.map(id=>({nome:el('an-'+id).value,quantidade:el('aq-'+id).value,custo:el('au-'+id).value}));
 return {versao:1,campos,modo:calcMode,filamentos,acessorios,resultado:calcular(),salvoEm:new Date().toISOString()};
}
function verProduto(id){
 const p=DB.produtos.find(p=>p.id===id);if(!p)return;const c=p.calculo;
 const linha=(nome,valor)=>'<p><strong>'+htmlSeguro(nome)+':</strong> '+htmlSeguro(valor)+'</p>';
 let detalhe=linha('Custo por unidade',R(p.custo))+linha('Preço sugerido',R(p.sugerido))+linha('Preço de venda padrão',R(p.preco));
 if(c){
  const f=c.campos;
  detalhe+=linha('Unidades por lote',f['c-unidades'])+linha('Tempo de impressão',f['c-horas']+' h')+linha('Impressora',c.resultado.impressoraNome)+linha('Potência',f['c-watts']+' W')+linha('Energia por kWh',R(f['c-kwh']))+linha('Valor da máquina',R(f['c-maquina']))+linha('Vida útil',f['c-vida']+' h')+linha('Falhas',f['c-falhas']+'%')+linha('Imposto',f['c-imposto']+'%')+linha('Cartão',f['c-cartao']+'%')+linha('Anúncio',R(f['c-anuncio']))+linha('Precificação',c.modo==='markup'?'Markup '+f['c-markup']:R(f['c-gpg'])+' por grama');
  detalhe+='<h3 style="margin-top:16px">Filamentos</h3>'+c.filamentos.filter(x=>x.material).map(x=>linha(x.material.nome,x.gramas+' g · '+R(Number(x.gramas)*x.material.gprice))).join('');
  detalhe+='<h3 style="margin-top:16px">Acessórios e embalagens</h3>'+c.acessorios.filter(x=>x.nome||Number(x.custo)).map(x=>linha(x.nome||'Item',x.quantidade+' × '+R(x.custo))).join('');
  detalhe+='<p class="gestao-ajuda">Esta ficha guarda os valores usados no cálculo salvo, incluindo o preço dos materiais. Para mudar a fabricação, abra o cálculo e salve a atualização.</p><button type="button" class="btn btn-green" data-reabrir-calculo="'+htmlSeguro(id)+'">Rever / atualizar cálculo</button>';
 } else detalhe+='<p class="gestao-ajuda">Este produto foi cadastrado sem um cálculo completo. Refaça o cálculo para salvar os detalhes de fabricação.</p><button type="button" class="btn" data-reabrir-calculo="'+htmlSeguro(id)+'">Calcular este produto</button>';
 el('ficha-produto').innerHTML='<section style="padding-top:24px;line-height:1.9"><h2>'+htmlSeguro(p.nome)+'</h2>'+detalhe+'</section>';
 el('ficha-produto').scrollIntoView({behavior:'smooth'});
}
function reabrirCalculoProduto(id){
 const p=DB.produtos.find(p=>p.id===id);if(!p)return;
 showTab('calcular');produtoCalculadoraId=id;
 const c=p.calculo;
 if(c){
  materiaisDoCalculo=c.filamentos.filter(x=>x.material).map(x=>({...x.material}));
  rebuildPrinterSelect();
  for(const campo of CAMPOS_CALCULO)el(campo).value=c.campos[campo]??'';
  el('c-nome').value=p.nome;
  filRows=c.filamentos.map(()=>uid());if(!filRows.length)filRows=[uid()];renderFilRows();
  c.filamentos.forEach((f,i)=>{el('fsel-'+filRows[i]).value=f.filamentoId;el('fg-'+filRows[i]).value=f.gramas;});
  accRows=[];el('acc-rows').innerHTML='';
  c.acessorios.forEach(a=>{addAccRow();const rid=accRows[accRows.length-1];el('an-'+rid).value=a.nome;el('aq-'+rid).value=a.quantidade;el('au-'+rid).value=a.custo;calcAccRow(rid);});
  if(!accRows.length)addAccRow();
  el('c-printer-amor-info').style.display='none';setMode(c.modo);calcular();
 }else{materiaisDoCalculo=null;limparCalculoBase();initCalc();el('c-nome').value=p.nome;calcular();}
 el('produto-em-edicao').textContent='Editando: '+p.nome+'. Ao salvar, este mesmo produto será atualizado.';
 el('produto-em-edicao').hidden=false;
 document.querySelector('[onclick="produtoDoCalculo()"]').textContent='Salvar alterações do produto';
 el('tab-calcular').scrollIntoView({behavior:'smooth'});toast('Cálculo aberto para revisão.');
}
const limparCalculoBase=limpar;
limpar=function(){produtoCalculadoraId=null;materiaisDoCalculo=null;rascunhoCalculo=null;limparCalculoBase();el('produto-em-edicao').hidden=true;document.querySelector('[onclick="produtoDoCalculo()"]').textContent='Cadastrar produto';};
const avisoEdicao=document.createElement('p');avisoEdicao.id='produto-em-edicao';avisoEdicao.className='gestao-ajuda';avisoEdicao.hidden=true;el('tab-calcular').prepend(avisoEdicao);

// A tela antiga fica fora da navegação; os dados históricos permanecem preservados.
el('mes-vendas').value=hojeISO().slice(0,7);limparVenda();atualizarGestao();showTab('calcular');
if(modoTeste){const aviso=document.createElement('div');aviso.id='modo-teste-aviso';aviso.textContent='Modo de teste · Dados separados neste aparelho. Nada é enviado ao Firebase.';el('app-screen').prepend(aviso);el('login-screen').style.display='none';el('app-screen').style.display='block';}
else if(location.protocol==='file:'){el('login-screen').style.display='flex';}

// Exemplo preenchido exclusivamente no armazenamento de teste.
if(modoTeste){
 const printerId='demo-impressora-130',filId='demo-filamento-pla',produtoId='demo-produto-completo';
 if(!DB.printers.some(p=>p.id===printerId))DB.printers=[...DB.printers,{id:printerId,nome:'Impressora de exemplo',watts:130,kwh:1.16,vida:20000,falhas:5,valorTotal:5000}];
 const material={id:filId,nome:'PLA de exemplo',tipo:'PLA',cor:'Branco',hex:'#ffffff',gprice:0.08,peso:1000,preco:80,estoque:1000};
 if(!DB.fils.some(f=>f.id===filId))DB.fils=[...DB.fils,material];
 if(!DB.produtos.some(p=>p.id===produtoId)){
 const campos={'c-nome':'Suporte de exemplo','c-data':today(),'c-unidades':'1','c-impressora':printerId,'c-horas':'2','c-watts':'130','c-kwh':'1.16','c-vida':'20000','c-maquina':'5000','c-falhas':'5','c-imposto':'0','c-cartao':'0','c-anuncio':'0','c-markup':'3','c-gpg':'','c-override':''};
 DB.produtos=[...DB.produtos,{id:produtoId,nome:'Suporte de exemplo',ativo:true,custo:0,sugerido:0,preco:0,calculo:{versao:1,campos,modo:'markup',filamentos:[{filamentoId:filId,gramas:'80',material}],acessorios:[{nome:'Embalagem',quantidade:'1',custo:'1'}],resultado:{impressoraNome:'Impressora de exemplo'}}}];
 reabrirCalculoProduto(produtoId);const r=calcular();DB.produtos=DB.produtos.map(p=>p.id===produtoId?{...p,custo:Number(r.custoUn.toFixed(2)),sugerido:Number(r.precoConsumidor.toFixed(2)),preco:Number(r.precoFinal.toFixed(2)),calculo:capturarCalculo()}:p);
 }else reabrirCalculoProduto(produtoId);
 renderPrinters();renderFils();atualizarGestao();el('p-watts').value=130;
}

document.addEventListener('keydown', e=>{if(e.key==='Escape' && el('edit-printer-modal').style.display==='flex')closeEditPrinter();});
