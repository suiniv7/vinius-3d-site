/* Preços calculados em centavos; faixas não se acumulam. */
const Kits = (()=>{
 const centavos=n=>Math.round((Number(n)+Number.EPSILON)*100);
 function opcoes(p){return Array.isArray(p.opcoes)?p.opcoes:[];}
 function ativo(p){return opcoes(p).length>0;}
 function calcular(p,quantidades){
  const linhas=opcoes(p).map(o=>{const qtd=Number(quantidades[o.id]||0);if(!Number.isSafeInteger(qtd)||qtd<0||qtd>999)throw Error('Use quantidades inteiras entre 0 e 999.');const preco=centavos(o.preco);if(!Number.isSafeInteger(preco)||preco<0)throw Error('Preço inválido.');return{...o,qtd,subtotal:preco*qtd,desconto:0};});
  const elegiveis=linhas.filter(l=>l.participaDesconto!==false),unidades=elegiveis.reduce((n,l)=>n+l.qtd,0);
  const faixa=(p.faixasDesconto||[]).filter(f=>Number.isInteger(f.minimo)&&f.minimo>=2&&f.percentual>0&&f.percentual<100&&unidades>=f.minimo).sort((a,b)=>b.minimo-a.minimo)[0];
  const base=elegiveis.reduce((n,l)=>n+l.subtotal,0),desconto=faixa?Math.round(base*faixa.percentual/100):0;
  let acumulado=0,distribuido=0;for(const l of elegiveis){acumulado+=l.subtotal;const meta=base?Math.round(desconto*acumulado/base):0;l.desconto=meta-distribuido;distribuido=meta;}
  for(const l of linhas)l.total=l.subtotal-l.desconto;
  const subtotal=linhas.reduce((n,l)=>n+l.subtotal,0);return{linhas,unidades,percentual:faixa?.percentual||0,subtotal,desconto,total:subtotal-desconto};
 }
 return{ativo,opcoes,calcular,centavos};
})();
